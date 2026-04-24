// src/app/core/services/sg/users.service.ts
import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { HMSUser } from "src/app/shared/models/user";
import { RequestMeta } from
  "src/app/shared/models/http/http-request";
import {
  UsersListFilters,
  UserBackofficeViewDto,
  PaginationMeta,
  ApiResponse,
  SortRule,
} from "@hms/shared-types/hms";
import {
  ensurePaginated,
  mapListResponse,
} from "src/app/shared/utils/api-response.utils";
import { buildListParams } from "../../utils/http-query.utils";
import { ApiService } from "../api-http.service";

@Injectable({ providedIn: "root" })
export class UsersService {
  constructor(
    private readonly api: ApiService,
  ) { }

  /**
   * Lists users and returns { items, meta, meta_extra }.
   * The filters may include pagination and multi-column sort.
   */
  listEndUsers(
    filters?: UsersListFilters,
  ): Observable<{
    items: UserBackofficeViewDto[];
    meta: PaginationMeta;
    meta_extra: Record<string, any>;
  }> {
    const params = buildListParams({
      fields: {
        term: filters?.term,
        username: filters?.username,
      },
      pagination: {
        page: filters?.page,
        per_page: filters?.per_page,
      },
      sort: filters?.sort,
    });

    const meta: RequestMeta = { params };

    return this.api
      .getWithMetaResponse<UserBackofficeViewDto[]>(`/users/backoffice/all`, meta)
      .pipe(
        map((resp: ApiResponse<UserBackofficeViewDto[]>) =>
          mapListResponse<UserBackofficeViewDto>(
            ensurePaginated<UserBackofficeViewDto>(resp),
          ),
        ),
      );
  }

  /**
   * Fetch user by id.
   * Adjust URL to your backend if necessary.
   */
  getEndUserById(id: string): Observable<UserBackofficeViewDto> {
    return this.api
      .get<UserBackofficeViewDto>(`/users/backoffice/${id}`)
      .pipe(map(resp => resp));
  }

  /**
   * Fetch user by username.
   * Adjust URL to your backend if necessary.
   */
  getEndUserByUsername(username: string): Observable<UserBackofficeViewDto> {
    return this.api
      .get<UserBackofficeViewDto>(
        `/users/backoffice/by-username/${encodeURIComponent(username)}`,
      )
      .pipe(map(resp => resp));
  }
}
