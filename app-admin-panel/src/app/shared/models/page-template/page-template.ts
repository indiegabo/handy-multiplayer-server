import { FormGroup } from "@angular/forms";
import { Breadcrumb } from "../../components/breadcrumbs/breadcrumbs";

/**
 * Represents a managing page State
 */
export interface PageState {

  /**
   * A loading indicator
   */
  loading: boolean;

  /**
   * The resource type so we can use on title and stuff
   */
  resourceType: string;

  /**
   * The pagination set up
   */
  pagination: PagePagination;

  /**
   * The resources to be handled
   */
  resources: any[];

  /**
   * The current resource being handled
   */
  resource: any;

  /**
   * The current resource being handled name
   */
  resourceName?: string;

  /**
   * The resource columns names
   */
  columns: string[];

  /**
   * The pages breadcrumbs
   */
  breadcrumbs: Breadcrumb[];

  /**
   * The columns to be displayed on the data table
   */
  displayedColumns: string[];

  /**
   * Method to search for resources upon API
   */
  search(): void;

  /**
   * Method to enter List mode
   */
  list(): void;

  /**
   * Method to enter view mode
   */
  view?(resource: any): void;

  /**
   * Method to enter add mode
   */
  add?(): void;

  /**
   * Method to enter edit mode
   */
  edit(resource: any): void;

  /**
   * Method to enter edit mode
   */
  delete?(resource: any): void;
}

/**
 * Represents a resource form component
 */
export interface ResourceForm {
  filterForm: FormGroup;
  resourceForm: FormGroup;
}

export interface PagePagination {
  perPage: number;
  pageIndex: number;
  limit?: number;
  total?: number;
  pageSizeOptions: number[];
}
