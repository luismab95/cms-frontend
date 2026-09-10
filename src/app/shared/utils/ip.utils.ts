import { publicIpv4 } from 'public-ip';
import { Observable, from } from 'rxjs';

export class IpUtils {
  getClientIp(): Observable<string> {
    const promise = publicIpv4();
    return from(promise);
  }
}
