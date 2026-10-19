import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { ResponseI } from '@shared/interfaces';
import { NotifyI } from '@core/interfaces';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  notifications = signal<NotifyI[]>([]);

  private readonly socket = signal<Socket>(null as unknown as Socket);
  private readonly url = environment.apiUrl;
  private readonly prefix = 'ms-cms';

  private readonly _httpClient = inject(HttpClient);

  /**
   * Constructor
   */
  constructor() {
    this.socket.set(
      io(`${this.url}`, {
        path: `/${this.prefix}/notify-socket/socket.io`,
      }),
    );
  }

  /**
   * Listen for incoming notifications
   * @returns
   */
  onNotification(): Observable<NotifyI> {
    return new Observable((observer) => {
      this.socket().on('receiveNotification', (data: any) => {
        const audio = new Audio('audios/notify.wav');
        audio.play();
        observer.next(data);
      });
    });
  }

  /**
   * Join a notification room
   * @param roleId
   */
  joinRoom(roleId: string) {
    this.socket().emit('joinRoom', roleId);
  }

  /**
   * Get all notifications
   * @returns
   */
  getAll(): Observable<ResponseI<NotifyI[]>> {
    return this._httpClient.get<ResponseI<NotifyI[]>>(`${this.url}/${this.prefix}/notify`).pipe(
      tap((response) => {
        this.notifications.set(response.message);
      }),
    );
  }

  /**
   * Update the notification
   * @param id
   * @returns
   */
  update(id: number): Observable<ResponseI<string>> {
    return this._httpClient
      .patch<ResponseI<string>>(`${this.url}/${this.prefix}/notify/${id}`, {})
      .pipe(
        tap(() => {
          this.getAll().subscribe();
        }),
      );
  }
}
