import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_TOKEN_KEY = 'authToken';
  private tokenSubject: BehaviorSubject<string | null>;
  public token: Observable<string | null>;
  private baseUrl: string = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {
    const storedToken = localStorage.getItem(this.AUTH_TOKEN_KEY);
    this.tokenSubject = new BehaviorSubject<string | null>(storedToken);
    this.token = this.tokenSubject.asObservable();
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('authToken', response.token);
        }
      })
    );
  }

  getCurrentUser(): Observable<User> {
    const token = localStorage.getItem('authToken');
    console.log("Token from localStorage:", token);
    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);
    // const headers = new HttpHeaders({
    //   'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    // });
    return this.http.get<User>('http://localhost:3000/users/me', { headers: headers });
  }


  logout(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    this.tokenSubject.next(null);
    this.router.navigate(['/login']);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    this.tokenSubject.next(token);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  addToFavorites(gameId: string, imageUrl: string): Observable<any> {
    const headers = this.createAuthorizationHeader();
    const url = `${this.baseUrl}/users/me/favorites`;
    return this.http.post(url, { gameId: gameId, imageUrl: imageUrl }, { headers: headers });
  }
  removeFromFavorites(gameId: string): Observable<any> {
    const headers = this.createAuthorizationHeader();
    const url = `${this.baseUrl}/users/me/favorites/${gameId}`;
    return this.http.delete(url, { headers: headers });
  }
  
  private createAuthorizationHeader(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  getFavorites(): Observable<any> {
    const headers = this.createAuthorizationHeader();
    const url = `${this.baseUrl}/users/me/favoriteGames`;
    return this.http.get<User>(url, { headers: headers });
  }

  isGameInFavorites(gameId: number): Observable<boolean> {
    return this.getFavorites().pipe(
      map(user => user.favoriteGames.some((favGame: { gameId: number }) => favGame.gameId === gameId)),
      catchError((error: any) => {
        console.error('Error al verificar si el juego está en favoritos:', error);
        return of(false);
      })
    );
  }
}
