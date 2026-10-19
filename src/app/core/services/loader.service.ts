import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  public readonly isLoading = new BehaviorSubject<boolean>(false);

  /**
   * Set the loading state  
   * @param value
   */
  setIsloading(value: boolean) {
    this.isLoading.next(value);
  }
}
