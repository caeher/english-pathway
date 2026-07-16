import fs from 'node:fs'
import path from 'node:path'
import { load as loadYaml } from 'js-yaml'
import { KNOWLEDGE_ROOT, moduleDir } from './paths'

export interface ModuleMeta {
  id: string
  number: number
  title: string
  description: string
  icon: string
  color: string
  chapters: string[]
}

export interface Catalog {
  modules: string[]
}

function readYamlFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf8')
  return loadYaml(raw) as T
}

export function loadCatalog(): Catalog {
  const catalogPath = path.join(KNOWLEDGE_ROOT, 'catalog.yaml')
  return readYamlFile<Catalog>(catalogPath)
}

export function loadModuleMeta(moduleId: string): ModuleMeta {
  const metaPath = path.join(moduleDir(moduleId), 'module.yaml')
  return readYamlFile<ModuleMeta>(metaPath)
}

export function loadAllModuleMeta(): ModuleMeta[] {
  const catalog = loadCatalog()
  return catalog.modules.map((id) => loadModuleMeta(id))
}
