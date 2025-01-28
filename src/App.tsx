// Instalaciones necesarias:
// npm install react react-dom tailwindcss @headlessui/react

import { useState, useEffect, useMemo } from 'react';
import './App.css'; // Tailwind ya configurado

type Spawn = {
  name: string,
  level: number;
  weight: number;
  bucket: string;
  context: string;
  conditions: string;
  anticonditions: string;
  biomes: string[];
};

type Entity = {
  nationalPokedexNumber: number;
  name: string;
  type: string[];
  implemented: boolean;
  aspects?: string[];
  baseStats: Record<string, number>;
  abilities: string[];
  form?: string;
  catchRate?: number;
  preEvolution?: string;
  evolutions?: string[];
  labels?: string[];
  maleRatio?: number;
  spawns?: Spawn[];
  source?: string;
  rarity?: string;
};

function capitalizeWords (str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function findSpawnsByAspect(spawns: Spawn[], aspect: string, strict: boolean): Spawn[] {
  if (!spawns || !aspect) return [];
  if (strict) return spawns.filter(spawn => spawn.name.toLowerCase() === aspect.toLowerCase());
  return spawns.filter(spawn => spawn.name.includes(aspect));
}

function getObjectPropertiesString(obj: Record<string, any>): string {
  if (!obj) return '';
  return Object.entries(obj)
      .map(([key, value]) => {
          if (key === 'biomes') return null;
          const capitalizedKey = capitalizeWords(key);
          return `${capitalizedKey}: ${value}`;
      })
      .join(', ');
}

function App() {
  const [atmdbData, setAtmdbData] = useState<Entity[]>([]);
  const [search, setSearch] = useState<string>('');
  const [sortKey, setSortKey] = useState<keyof Entity>('nationalPokedexNumber');
  const [isAscending, setIsAscending] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  const cleanString = (str: string): string => {
    if (!str) return ''; // Devuelve una cadena vacía si no hay valor
    const forbiddenWords = ['prueba']; // Lista de palabras prohibidas
    const escapedWords = forbiddenWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
    return str.replace(regex, '').replace(/\\s+/g, ' ').trim();
  };

  const RARITY: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    'ultra-rare': 4,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('./data/codex.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch entities.json: ${response.statusText}`);
        }

        const data = await response.json();

        const entities: Entity[] = data.map((entry: any) => {

          // Obtenemos los spawns
          const spawns: Spawn[] = entry.spawns ? entry.spawns.spawns.map((spawn: any) => ({
            name: spawn.pokemon,
            level: spawn.level || 0,
            weight: spawn.weight,
            context: spawn.context,
            bucket: spawn.bucket,
            conditions: getObjectPropertiesString(spawn.condition),
            anticonditions: getObjectPropertiesString(spawn.anticonditions),
            biomes: spawn.condition?.biomes || []
          })) : [];

          const baseEntity: Entity = {
            nationalPokedexNumber: entry.nationalPokedexNumber,
            name: entry.name,
            type: [entry.primaryType, entry.secondaryType].filter(Boolean),
            implemented: entry.implemented === false || entry.implemented === undefined ? false : true,
            aspects: entry.aspects,
            baseStats: entry.baseStats,
            abilities: entry.abilities,
            catchRate: entry.catchRate,
            preEvolution: capitalizeWords(entry.preEvolution),
            evolutions: entry.evolutions?.map((evolution: any) => capitalizeWords(cleanString(evolution.result))) || [],
            labels: entry.labels,
            maleRatio: entry.maleRatio,
            spawns: findSpawnsByAspect(spawns, entry.name, true),
            rarity: entry.rarity,
            source: entry.source,
          };

          // Calcular la ubicación más fácil (prioridad más baja)
          if (baseEntity.spawns) {
            baseEntity.rarity = baseEntity.spawns.reduce((easiest, spawn) => {
              const bucket = spawn.bucket as keyof typeof RARITY; // Asegúrate de que sea una clave válida
              return RARITY[bucket] < RARITY[easiest as keyof typeof RARITY]
                ? bucket
                : easiest;
            }, 'ultra-rare' as keyof typeof RARITY); // Tipo inicial
          }

          const forms = entry.forms?.map((form: any) => ({
            nationalPokedexNumber: baseEntity.nationalPokedexNumber,
            name: baseEntity.name,
            form: form.name,
            aspects: form.aspects,
            type: [form.primaryType, form.secondaryType].filter(Boolean),
            implemented: baseEntity.implemented === false || baseEntity.implemented === undefined ? false : true,
            baseStats: form.baseStats,
            abilities: form.abilities,
            catchRate: form.catchRate,
            preEvolution: capitalizeWords(form.preEvolution),
            evolutions: form.evolutions?.map((evolution: any) => capitalizeWords(cleanString(evolution.result))) || [],
            labels: form.labels || baseEntity.labels,
            maleRatio: form.maleRatio || baseEntity.maleRatio,
            spawns: findSpawnsByAspect(spawns, form.aspects ? form.aspects[0] : null, false),
            rarity: baseEntity.rarity,
            source: baseEntity.source,
          })) || [];

          return [baseEntity, ...forms];
        }).flat();

        setAtmdbData(entities);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return atmdbData
      .filter((entity) => {
        const searchLower = search.toLowerCase();
        return (
          entity.name.toLowerCase().includes(searchLower) ||
          (entity.preEvolution?.toLowerCase().includes(searchLower) ?? false) ||
          entity.evolutions?.some(evolution => evolution.toLowerCase().includes(searchLower)) ||
          entity.labels?.some(label => label.toLowerCase().includes(searchLower))
        );
      })
      .sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
  
        if (aValue === undefined || bValue === undefined) {
          return 0; // Si alguna clave es undefined, no se cambia el orden
        }
  
        if (aValue < bValue) return isAscending ? -1 : 1;
        if (aValue > bValue) return isAscending ? 1 : -1;
        return 0;
      });
  }, [atmdbData, search, sortKey, isAscending]);

  const handleSort = (key: keyof Entity) => {
    if (sortKey === key) {
      setIsAscending(!isAscending);
    } else {
      setSortKey(key);
      setIsAscending(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <h1 className="text-2xl font-bold text-center mb-5">ATMDB List</h1>

      <input type="text" placeholder="Buscar..." className="border p-2 rounded w-full mb-5" value={search} onChange={(e) => setSearch(e.target.value)} />

      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="cursor-pointer border border-gray-300 px-4 py-2" onClick={() => handleSort('nationalPokedexNumber')}>#</th>
            <th className="cursor-pointer border border-gray-300 px-4 py-2" onClick={() => handleSort('name')}>Name</th>
            <th className="cursor-pointer border border-gray-300 px-4 py-2" onClick={() => handleSort('implemented')}>InGame</th>
            <th className="border border-gray-300 px-4 py-2">Types</th>
            <th className="border border-gray-300 px-4 py-2">Source</th>
            <th className="border border-gray-300 px-4 py-2">Pre-evolución</th>
            <th className="border border-gray-300 px-4 py-2">Evoluciones</th>
            <th className="border border-gray-300 px-4 py-2">Etiquetas</th>
            <th className="border border-gray-300 px-4 py-2">Captura</th>
            <th className="border border-gray-300 px-4 py-2">Género(♂)</th>
            <th className="border border-gray-300 px-4 py-2">Rarity</th>
            <th className="border border-gray-300 px-4 py-2">Spawns</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((entity) => (
            <tr key={`${entity.nationalPokedexNumber}-${entity.form || 'base'}`} className="hover:bg-gray-200 cursor-pointer" onClick={() => setSelectedEntity(entity)} >
              <td className="border border-gray-300 px-4 py-2">{entity.nationalPokedexNumber.toString().padStart(4, '0')}</td>
              <td className="border border-gray-300 px-4 py-2">
                {entity.name}
                {entity.form && <span className="text-sm text-gray-500"> ({entity.form})</span>}
              </td>
              <td className="border border-gray-300 px-4 py-2">{entity.implemented ? 'Yes' : 'No'}</td>
              <td className="border border-gray-300 px-4 py-2">
                {entity.type.map((type, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-xl text-gray-50 mr-1 ${
                      type === 'fire'     ? 'bg-red-500    border-red-700' :
                      type === 'water'    ? 'bg-blue-500   border-blue-700' :
                      type === 'grass'    ? 'bg-green-600  border-green-800' :
                      type === 'dragon'   ? 'bg-violet-500 border-violet-700' :
                      type === 'flying'   ? 'bg-indigo-500 border-indigo-500' :
                      type === 'poison'   ? 'bg-violet-800 border-violet-950' :
                      type === 'bug'      ? 'bg-green-400  border-green-600' :
                      type === 'dark'     ? 'bg-gray-700   border-gray-900' :
                      type === 'electric' ? 'bg-yellow-300 border-yellow-500' :
                      type === 'ice'      ? 'bg-blue-400   border-blue-600' :
                      type === 'steel'    ? 'bg-gray-300   border-gray-500' :
                      type === 'ground'   ? 'bg-amber-600  border-amber-800' :
                      type === 'fairy'    ? 'bg-pink-300   border-indigo-500' :
                      type === 'rock'     ? 'bg-amber-800  border-amber-950' :
                      type === 'psychic'  ? 'bg-pink-500   border-pink-700' :
                      type === 'fighting' ? 'bg-red-700    border-red-900' :
                      type === 'ghost'    ? 'bg-indigo-700 border-indigo-900' :
                      'bg-gray-500 border-gray-700'
                    }`}
                  >
                  {capitalizeWords(type)}
                  </span>
                ))}
              </td>
              <td className="border border-gray-300 px-4 py-2">{entity.source}</td>
              <td className="border border-gray-300 px-4 py-2">{entity.preEvolution || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{entity.evolutions?.join(', ') || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{entity.labels?.join(', ') || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{entity.catchRate || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{entity.maleRatio !== undefined ? `${entity.maleRatio * 100}%` : 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{entity.rarity}</td>
              <td className="border border-gray-300 px-4 py-2">{entity.spawns?.length || 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedEntity && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setSelectedEntity(null)}>
          <div className="bg-white p-5 rounded shadow-lg w-1/2">
            <h2 className="text-xl font-bold mb-1">{selectedEntity.name}</h2>
            {selectedEntity.form && <p className="text-sm text-gray-500 mb-1">Forma: {selectedEntity.form}</p>}
            <p><strong>Número:</strong> {selectedEntity.nationalPokedexNumber}</p>
            <p><strong>Tipo: </strong>
              {selectedEntity.type.map((type, index) => (
                <span
                key={index}
                className={`px-3 py-1 rounded-xl text-gray-50 mr-1 ${
                  type === 'fire'     ? 'bg-red-500    border-red-700' :
                  type === 'water'    ? 'bg-blue-500   border-blue-700' :
                  type === 'grass'    ? 'bg-green-600  border-green-800' :
                  type === 'dragon'   ? 'bg-violet-500 border-violet-700' :
                  type === 'flying'   ? 'bg-indigo-500 border-indigo-500' :
                  type === 'poison'   ? 'bg-violet-800 border-violet-950' :
                  type === 'bug'      ? 'bg-green-400  border-green-600' :
                  type === 'dark'     ? 'bg-gray-700   border-gray-900' :
                  type === 'electric' ? 'bg-yellow-300 border-yellow-500' :
                  type === 'ice'      ? 'bg-blue-400   border-blue-600' :
                  type === 'steel'    ? 'bg-gray-300   border-gray-500' :
                  type === 'ground'   ? 'bg-amber-600  border-amber-800' :
                  type === 'fairy'    ? 'bg-pink-300   border-indigo-500' :
                  type === 'rock'     ? 'bg-amber-800  border-amber-950' :
                  type === 'psychic'  ? 'bg-pink-500   border-pink-700' :
                  type === 'fighting' ? 'bg-red-700    border-red-900' :
                  type === 'ghost'    ? 'bg-indigo-700 border-indigo-900' :
                  'bg-gray-500 border-gray-700'
                }`}
              >
              {capitalizeWords(type)}
              </span>
              ))}
            </p>
            <p><strong>Source:</strong> {selectedEntity.source}</p>
            <div className="mt-1">
              <h3 className="font-bold">Estadísticas:</h3>
              <ul>
                {Object.entries(selectedEntity.baseStats).map(([key, value]) => (
                  <li key={key} className="capitalize">
                    {key}: {value}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-1"><strong>Habilidades:</strong> {selectedEntity.abilities.join(', ')}</p>
            <p className="mt-1"><strong>Etiquetas:</strong> {selectedEntity.labels?.join(', ') || 'N/A'}</p>
            <p className="mt-1"><strong>Aspecto:</strong> {selectedEntity.aspects ? selectedEntity.aspects[0] : 'N/A'}</p>
            <p className="mt-1"><strong>Ratio de Captura:</strong> {selectedEntity.catchRate}</p>
            <p className="mt-1"><strong>Ratio de Género:</strong> {selectedEntity.maleRatio !== undefined ? `${selectedEntity.maleRatio * 100}%` : 'N/A'}</p>
            <p className="mt-1"><strong>Pre-evolución:</strong> {selectedEntity.preEvolution || 'N/A'}</p>
            <p className="mt-1 h-12 overflow-auto"><strong>Evoluciones:</strong> {selectedEntity.evolutions?.join(', ') || 'N/A'}</p>
            {selectedEntity.spawns && (
              <div className="mt-1">
                <h3 className="font-bold">Spawns:</h3>
                <ul className="h-28 overflow-auto">
                  {selectedEntity.spawns.map((spawn, index) => (
                    <li key={index} className="mb-2">
                      <strong>Pokemon:</strong> {spawn.name}<br />
                      <strong>Nivel:</strong> {spawn.level}<br />
                      <strong>Peso:</strong> {spawn.weight}<br />
                      <strong>Bucket:</strong> {spawn.bucket}<br />
                      <strong>Context:</strong> {spawn.context}<br />
                      <strong>Conditions:</strong> {spawn.conditions}<br />
                      <strong>Anticonditions:</strong> {spawn.anticonditions}<br />
                      <strong>Biomes:</strong> {spawn.biomes.join(', ')}<br />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="mt-5 bg-red-500 text-white py-2 px-4 rounded" onClick={() => setSelectedEntity(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
