export function LogMethod() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      console.log(
        `[${new Date().toISOString()}] Calling ${target.constructor.name}.${propertyKey}`,
      );
      try {
        const result = await originalMethod.apply(this, args);
        console.log(
          `[${new Date().toISOString()}] ${target.constructor.name}.${propertyKey} completed successfully`,
        );
        return result;
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] ${target.constructor.name}.${propertyKey} failed:`,
          error,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
