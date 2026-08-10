import { ValidationError } from 'class-validator';
import { I18nContext } from 'nestjs-i18n';

const WHITELIST_VALIDATION_CONSTRAINT = 'whitelistValidation';

export const formatI18nValidationErrors = (
  validationErrors: ValidationError[],
): string[] => validationErrors.flatMap(formatI18nValidationError);

const formatI18nValidationError = (
  validationError: ValidationError,
): string[] => {
  const messages = Object.entries(validationError.constraints ?? {}).map(
    ([constraint, message]) =>
      constraint === WHITELIST_VALIDATION_CONSTRAINT
        ? translateWhitelistValidationError(validationError.property)
        : message,
  );
  const childMessages =
    validationError.children?.flatMap(formatI18nValidationError) ?? [];

  return [...messages, ...childMessages];
};

const translateWhitelistValidationError = (property: string): string => {
  const i18nContext = I18nContext.current();

  return (
    i18nContext?.t('translation.VALIDATION.WHITELIST', {
      args: { property },
    }) ?? `${property} should not exist`
  );
};
