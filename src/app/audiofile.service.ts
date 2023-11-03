import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudiofileService {

  file: File | null = null;
  constructor() { }
}
