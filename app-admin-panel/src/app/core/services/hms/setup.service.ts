import { Injectable } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { AdminCreationPayload, ConnectionStatusDto, CreateAdminAccountResponseDto, OwnerCheckUpDto, Prepare2FAAccountCreationResponseDto, SetupStatusDto, StartOwnerCreationDto } from "@hms/shared-types/hms";
import { ApiService } from "../api-http.service";

@Injectable({
  providedIn: 'root'
})
export class SetupService {

  constructor(
    private apiService: ApiService,
  ) { }

  status(): Observable<SetupStatusDto> {
    return this.apiService.get<SetupStatusDto>('/app-setup/status');
  }

  checkAllConnections(): Observable<ConnectionStatusDto[]> {
    return forkJoin([
      this.apiService.get<ConnectionStatusDto>('/app-setup/connection-status/main-db'),
      this.apiService.get<ConnectionStatusDto>('/app-setup/connection-status/game-db'),
      this.apiService.get<ConnectionStatusDto>('/app-setup/connection-status/redis'),
      this.apiService.get<ConnectionStatusDto>('/app-setup/connection-status/smtp')
    ]);
  }

  checkOwnerExists(): Observable<OwnerCheckUpDto> {
    return this.apiService.get<OwnerCheckUpDto>('/app-setup/owner-exists');
  }

  startOwnerCreation(payload: StartOwnerCreationDto): Observable<Prepare2FAAccountCreationResponseDto> {
    const meta = {
      body: payload
    }
    return this.apiService.post<Prepare2FAAccountCreationResponseDto>('/app-setup/start-owner-creation', meta);
  }

  createOwner(payload: AdminCreationPayload): Observable<CreateAdminAccountResponseDto> {
    const meta = {
      body: payload
    }
    return this.apiService.post<CreateAdminAccountResponseDto>('/app-setup/create-owner', meta);
  }
}
