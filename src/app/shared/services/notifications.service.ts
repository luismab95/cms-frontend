import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { NotifyI } from '../interfaces/notifications.types';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
    private socket: Socket;

    private url = environment.apiUrl;
    private _notifications: ReplaySubject<NotifyI[]> = new ReplaySubject<
        NotifyI[]
    >(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
        this.socket = io(`${this.url}`, {
            path: '/ms-cms/notify-socket/socket.io',
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for notifications
     */
    get notifications$(): Observable<NotifyI[]> {
        return this._notifications.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // Recibir notificaciones
    onNotification(): Observable<any> {
        return new Observable((observer) => {
            this.socket.on('receiveNotification', (data) => {
                const audio = new Audio('audios/notify.wav');
                audio.play();
                observer.next(data);
            });
        });
    }

    joinRoom(roleId: string) {
        this.socket.emit('joinRoom', roleId);
    }

    /**
     * Get all notifications
     */
    getAll(): Observable<ResponseI<NotifyI[]>> {
        return this._httpClient
            .get<ResponseI<NotifyI[]>>(`${this.url}/ms-cms/notify`)
            .pipe(
                tap((response) => {
                    this._notifications.next(response.message);
                })
            );
    }

    /**
     * Update the notification
     *
     * @param id
     */
    update(id: number): Observable<ResponseI<string>> {
        return this._httpClient
            .patch<ResponseI<string>>(`${this.url}/ms-cms/notify/${id}`, {})
            .pipe(
                tap(() => {
                    this.getAll().subscribe();
                })
            );
    }
}
