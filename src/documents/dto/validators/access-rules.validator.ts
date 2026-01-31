import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'hasAtLeastOneAccessRule', async: false })
export class HasAtLeastOneAccessRuleConstraint
  implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const accessRules = args.object as { roles?: string[]; departments?: string[]; positions?: string[] };

    const hasRoles = !!(accessRules.roles && accessRules.roles.length > 0);
    const hasDepartments = !!(accessRules.departments && accessRules.departments.length > 0);
    const hasPositions = !!(accessRules.positions && accessRules.positions.length > 0);

    return hasRoles || hasDepartments || hasPositions;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'At least one access rule (roles, departments, or positions) is required';
  }
}

export function HasAtLeastOneAccessRule(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasAtLeastOneAccessRuleConstraint,
    });
  };
}
