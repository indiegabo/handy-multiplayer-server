import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TranslaterModule } from "./translater/translater.module";
import { NavigationModule } from "./navigation/navigation.module";
import { BreadcrumbsModule } from "./breadcrumbs/breadcrumbs.module";
import { CornerButtonModule } from "./corner-button/corner-button.module";
import { FlagIconModule } from "./flag-icon/flag-icon.module";
import { ImageHandlingModule } from "./image-handling/image-handling.module";
import { LoadingModule } from "./loading/loading.module";
import { MaterialModule } from "./material/material.module";
import { NothingHereModule } from "./nothing-here/nothing-here.module";
import { PageLoaderModule } from "./page-loader/page-loader.module";
import { SettingsMenuModule } from "./settings-menu/settings-menu.module";
import { ToggleButtonsModule } from "./toggle-buttons/toggle-buttons.module";
import { TabsModule } from "./tabs/tabs.module";
import { LoadersModule } from "./loaders/loaders.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { GenericDialogsModule } from "./generic-dialogs/generic-dialogs.module";
import { MessageBoxesModule } from "./message-boxes/message-boxes.module";
import { AvatarsModule } from "./avatars/avatars.module";
import { CardsModule } from "./cards/cards.module";
import { HandyFormsModule } from "./handy-forms/handy-forms.module";
import { ContainersModule } from "./containers/containers.module";
import { AuthModule } from "./auth/auth.module";
import { TextEditorsModule } from "./text-editors/text-editors.module";

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  exports: [
    MaterialModule,

    BreadcrumbsModule,
    CornerButtonModule,
    FlagIconModule,
    FontAwesomeModule,
    AuthModule,
    ImageHandlingModule,
    LoadingModule,
    NavigationModule,
    NothingHereModule,
    PageLoaderModule,
    TranslaterModule,
    SettingsMenuModule,
    ToggleButtonsModule,
    HandyFormsModule,
    TabsModule,
    AvatarsModule,
    LoadersModule,
    GenericDialogsModule,
    MessageBoxesModule,
    CardsModule,
    ContainersModule,
    TextEditorsModule,
  ],
})
export class SharedComponentsModule { }
