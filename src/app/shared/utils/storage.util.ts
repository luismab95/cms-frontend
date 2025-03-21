import { Injectable } from '@angular/core';
import { EncryptStorage } from 'encrypt-storage';
import { environment } from 'environments/environment';

const encryptStorage = new EncryptStorage(environment.secretKey);
const isProduction = environment.production;

@Injectable({ providedIn: 'root' })
export class StorageUtils {
  saveLocalStorage(key: string, value: string) {
    if (isProduction) {
      const hash = encryptStorage.hash(key);
      encryptStorage.setItem(hash, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  getLocalStorage(key: string): string | undefined {
    if (isProduction) {
      const hash = encryptStorage.hash(key);
      return encryptStorage.getItem(hash);
    } else {
      return localStorage.getItem(key) ?? undefined;
    }
  }

  deleteKeyStorage(key: string) {
    if (isProduction) {
      const hash = encryptStorage.hash(key);
      return encryptStorage.removeItem(hash);
    } else {
      localStorage.removeItem(key);
    }
  }
}


export function getLocalStorage(key: string): string | undefined {
  if (isProduction) {
    const hash = encryptStorage.hash(key);
    return encryptStorage.getItem(hash);
  } else {
    return localStorage.getItem(key) ?? undefined;
  }
}