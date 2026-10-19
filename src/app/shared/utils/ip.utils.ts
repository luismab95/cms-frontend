import { publicIpv4 } from 'public-ip';
import { Observable, from } from 'rxjs';

export class IpUtils {

  /**
   * Get client Ip
   * @returns 
   */
  getClientIp(): Observable<string> {
    const promise = publicIpv4();
    return from(promise);
  }
}
