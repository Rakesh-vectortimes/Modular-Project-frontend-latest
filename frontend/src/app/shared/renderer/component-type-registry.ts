import { InjectionToken, Type } from '@angular/core';

import { AccordionShapeComponent } from './shapes/accordion-shape.component';
import { AvatarShapeComponent } from './shapes/avatar-shape.component';
import { BadgeShapeComponent } from './shapes/badge-shape.component';
import { BreadcrumbShapeComponent } from './shapes/breadcrumb-shape.component';
import { ButtonShapeComponent } from './shapes/button-shape.component';
import { CardShapeComponent } from './shapes/card-shape.component';
import { CheckboxShapeComponent } from './shapes/checkbox-shape.component';
import { DataTableShapeComponent } from './shapes/data-table-shape.component';
import { DatePickerShapeComponent } from './shapes/date-picker-shape.component';
import { DividerShapeComponent } from './shapes/divider-shape.component';
import { DropdownShapeComponent } from './shapes/dropdown-shape.component';
import { EmailInputShapeComponent } from './shapes/email-input-shape.component';
import { FileUploadShapeComponent } from './shapes/file-upload-shape.component';
import { HeadingShapeComponent } from './shapes/heading-shape.component';
import { IconShapeComponent } from './shapes/icon-shape.component';
import { ImageShapeComponent } from './shapes/image-shape.component';
import { KanbanShapeComponent } from './shapes/kanban-shape.component';
import { LinkButtonShapeComponent } from './shapes/link-button-shape.component';
import { ListShapeComponent } from './shapes/list-shape.component';
import { NavbarShapeComponent } from './shapes/navbar-shape.component';
import { NumberInputShapeComponent } from './shapes/number-input-shape.component';
import { PageShapeComponent } from './shapes/page-shape.component';
import { PasswordInputShapeComponent } from './shapes/password-input-shape.component';
import { ProgressBarShapeComponent } from './shapes/progress-bar-shape.component';
import { RadioGroupShapeComponent } from './shapes/radio-group-shape.component';
import { RatingShapeComponent } from './shapes/rating-shape.component';
import { RowShapeComponent } from './shapes/row-shape.component';
import { SectionShapeComponent } from './shapes/section-shape.component';
import { SocialLoginButtonShapeComponent } from './shapes/social-login-button-shape.component';
import { SpacerShapeComponent } from './shapes/spacer-shape.component';
import { StepperShapeComponent } from './shapes/stepper-shape.component';
import { TabsShapeComponent } from './shapes/tabs-shape.component';
import { TextInputShapeComponent } from './shapes/text-input-shape.component';
import { TextShapeComponent } from './shapes/text-shape.component';
import { TextareaShapeComponent } from './shapes/textarea-shape.component';
import { ToggleSwitchShapeComponent } from './shapes/toggle-switch-shape.component';
import { ContainerShapeComponent } from './shapes/container-shape.component';
import { DisplayShapeComponent } from './shapes/display-shape.component';
import { MediaShapeComponent } from './shapes/media-shape.component';
import { TextBlockShapeComponent } from './shapes/text-block-shape.component';
import { UserInputShapeComponent } from './shapes/user-input-shape.component';
import { WidgetShapeComponent } from './shapes/widget-shape.component';
import { VideoEmbedShapeComponent } from './shapes/video-embed-shape.component';

export const COMPONENT_TYPE_REGISTRY = new InjectionToken<
  Map<string, Type<unknown>>
>('COMPONENT_TYPE_REGISTRY');

export const COMPONENT_REGISTRY_MAP = new Map<string, Type<unknown>>([
  // Basic Fields
  ['user_input', UserInputShapeComponent],
  ['text_block', TextBlockShapeComponent],
  ['media', MediaShapeComponent],
  ['container', ContainerShapeComponent],
  ['display', DisplayShapeComponent],
  ['widget', WidgetShapeComponent],
  ['text_input', TextInputShapeComponent],
  ['textarea', TextareaShapeComponent],
  ['number_input', NumberInputShapeComponent],
  ['dropdown', DropdownShapeComponent],
  ['checkbox', CheckboxShapeComponent],
  ['radio_group', RadioGroupShapeComponent],
  ['email_input', EmailInputShapeComponent],
  ['password_input', PasswordInputShapeComponent],
  ['date_picker', DatePickerShapeComponent],
  ['toggle_switch', ToggleSwitchShapeComponent],
  ['file_upload', FileUploadShapeComponent],

  // Actions
  ['button', ButtonShapeComponent],
  ['link_button', LinkButtonShapeComponent],
  ['social_login_button', SocialLoginButtonShapeComponent],

  // Layout
  ['page', PageShapeComponent],
  ['section', SectionShapeComponent],
  ['heading', HeadingShapeComponent],
  ['text', TextShapeComponent],
  ['row', RowShapeComponent],
  ['card', CardShapeComponent],
  ['divider', DividerShapeComponent],
  ['spacer', SpacerShapeComponent],
  ['navbar', NavbarShapeComponent],
  ['tabs', TabsShapeComponent],
  ['breadcrumb', BreadcrumbShapeComponent],
  ['stepper', StepperShapeComponent],
  ['accordion', AccordionShapeComponent],

  // Branding
  ['image', ImageShapeComponent],
  ['avatar', AvatarShapeComponent],
  ['video_embed', VideoEmbedShapeComponent],
  ['icon', IconShapeComponent],

  // Display
  ['badge', BadgeShapeComponent],
  ['list', ListShapeComponent],
  ['data_table', DataTableShapeComponent],
  ['progress_bar', ProgressBarShapeComponent],
  ['rating', RatingShapeComponent],

  // Advanced
  ['kanban_board', KanbanShapeComponent],
]);

export function provideComponentRendererRegistry() {
  return { provide: COMPONENT_TYPE_REGISTRY, useValue: COMPONENT_REGISTRY_MAP };
}
