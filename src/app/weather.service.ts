import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { protectedResources } from './auth-config';
import { Weather } from './weather';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  url = protectedResources.weatherApi.endpoint

  constructor(private http: HttpClient) { }

  getWeather() { 
    return this.http.get<Weather>(this.url);
  }
}
