import type {PlatformModule} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";

/** Every module `name` needs, transitively (excluding itself). */
export function dependenciesOf(name: string, catalog: readonly PlatformModule[]): string[] {
    const byName = new Map(catalog.map((module) => [module.name, module]));
    const found = new Set<string>();
    const queue = [...(byName.get(name)?.dependsOn ?? [])];
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
        if (found.has(next) || next === name) continue;
        found.add(next);
        queue.push(...(byName.get(next)?.dependsOn ?? []));
    }
    return [...found];
}

/** Selected modules that need `name`, so it cannot be unchecked while they stay checked. */
export function selectedDependentsOf(name: string, selected: readonly string[], catalog: readonly PlatformModule[]): string[] {
    return selected.filter((other) => other !== name && dependenciesOf(other, catalog).includes(name));
}

/** Checking adds the module's dependencies; unchecking only removes the module itself. */
export function toggleModule(selected: readonly string[], name: string, checked: boolean, catalog: readonly PlatformModule[]): string[] {
    if (checked) {
        return [...new Set([...selected, name, ...dependenciesOf(name, catalog)])];
    }
    return selected.filter((other) => other !== name);
}
