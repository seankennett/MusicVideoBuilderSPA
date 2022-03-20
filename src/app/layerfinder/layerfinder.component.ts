import { Component, OnInit } from '@angular/core';
import { Weather } from '../weather';
import { WeatherService } from '../weather.service';

@Component({
  selector: 'app-layerfinder',
  templateUrl: './layerfinder.component.html',
  styleUrls: ['./layerfinder.component.scss']
})
export class LayerFinderComponent implements OnInit {

  weather?: Weather

  constructor(private service: WeatherService) { }

  ngOnInit(): void {
    this.getWeather();
  }

  getWeather(): void {
    this.service.getWeather()
      .subscribe((weather: Weather) => {
        this.weather = weather;
      });
  }
}
