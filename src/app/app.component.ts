import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CesiumMapComponent } from '../app/cesium-map/cesium-map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CesiumMapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Добавление 3D тайлов с рандомными цветами при нажатии на чекбокс и наложить эффект ховера при наведении';
}
