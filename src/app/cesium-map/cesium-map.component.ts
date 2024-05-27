import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Ion,
  Viewer,
  Cesium3DTileset,
  Color,
  Terrain,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  defined,
  Label,
  LabelCollection,
  Cartesian3,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
} from 'cesium';

import { environment } from '../../environment/environment';

@Component({
  selector: 'app-cesium-map',
  standalone: true,
  templateUrl: './cesium-map.component.html',
  styleUrls: ['./cesium-map.component.css'],
})
export class CesiumMapComponent implements OnInit, OnDestroy {
  private viewer!: Viewer;
  private tileset!: Cesium3DTileset | null;
  private isColored!: boolean;
  private features: any = [];
  private labelCollection!: LabelCollection;

  listAll3DTileFeatures(tileset: Cesium3DTileset) {
    const features: any = [];

    tileset.tileVisible.addEventListener(function (tile) {
      const content = tile.content;
      const featuresLength = content.featuresLength;

      for (let i = 0; i < featuresLength; i++) {
        const feature = content.getFeature(i);

        if (features.indexOf(feature) !== -1) {
          return;
        }

        features.push(feature);
      }
    });

    return features;
  }

  // Function to create labels for all features in a 3D tileset
  toggleLabelsForFeatures() {
    this.labelCollection.removeAll();

    if (this.isColored) {
      this.features.forEach((feature: any) => {
        const position: Cartesian3 = feature.content._model.boundingSphere.center;

        if (position) {
          this.labelCollection.add({
            position,
            text: new Date().toDateString(), // Assuming features have a 'name' property
            font: '14pt sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -10), // Adjust to place label slightly above the feature
          });
        }
      });
    }
  }

  async ngOnInit() {
    Ion.defaultAccessToken = environment.cesiumToken;

    this.viewer = new Viewer('cesiumContainer', {
      terrain: Terrain.fromWorldTerrain(),
      geocoder: false,
      fullscreenButton: false
    });

    try {
      this.tileset = await Cesium3DTileset.fromIonAssetId(75343);

      this.viewer.scene.primitives.add(this.tileset);
      this.viewer.zoomTo(this.tileset);

      this.features = this.listAll3DTileFeatures(this.tileset);
    } catch (error) {
      console.error(`Error creating tileset: ${error}`);
    }

    this.labelCollection = this.viewer.scene.primitives.add(
      new LabelCollection()
    );

    // Information about the currently highlighted feature
    const highlighted: {
      feature: any;
      originalColor: Color;
    } = {
      feature: undefined,
      originalColor: new Color(),
    };

    // Color a feature translucent on hover.
    this.viewer.screenSpaceEventHandler.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
      if (this.isColored) {
        // If a feature was previously highlighted, undo the highlight
        if (defined(highlighted.feature) && highlighted.feature) {
          highlighted.feature.color = highlighted.originalColor;
          highlighted.feature = undefined;
        }

        // Pick a new feature
        const pickedFeature = this.viewer.scene.pick(movement.endPosition);

        if (!defined(pickedFeature) || pickedFeature.primitive instanceof Label) {
          return;
        }
        // Highlight the feature
        highlighted.feature = pickedFeature;
        Color.clone(pickedFeature.color, highlighted.originalColor);
        pickedFeature.color = Color.fromAlpha(pickedFeature.color, 0.5);
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);
  }

  toggleColorTile(): void {
    this.features.forEach((feature: any) => {
      feature.color = this.isColored
        ? Color.fromRandom({ alpha: 1.0 })
        : Color.WHITE;
      feature.content._model.silhouetteColor = this.isColored ? Color.BLACK.withAlpha(0.3) : new Color;
      feature.content._model.silhouetteSize = this.isColored ? 2.0 : 0;
    });
  }

  toggleRandomColors(event: Event): void {
    this.isColored = (event.target as HTMLInputElement).checked;

    this.toggleColorTile();
    this.toggleLabelsForFeatures();
  }

  ngOnDestroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
    }
  }
}
