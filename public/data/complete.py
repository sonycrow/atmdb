import os
import json

def merge_json_repositories(original_repo, expansion_repo, output_file):
    try:
        # Comprobar si los directorios existen
        if not os.path.isdir(original_repo):
            raise OSError(f"El directorio original '{original_repo}' no existe o no es accesible.")
        if not os.path.isdir(expansion_repo):
            raise OSError(f"El directorio de ampliación '{expansion_repo}' no existe o no es accesible.")

        # Listar archivos JSON en ambos directorios, excluyendo '_index.json'
        original_files = [f for f in os.listdir(original_repo) 
                          if os.path.isfile(os.path.join(original_repo, f)) and f.endswith('.json') and f != '_index.json']
        expansion_files = [f for f in os.listdir(expansion_repo) 
                           if os.path.isfile(os.path.join(expansion_repo, f)) and f.endswith('.json') and f != '_index.json']

        # Cargar datos del repositorio original
        combined_data = {}
        for file in original_files:
            file_path = os.path.join(original_repo, file)
            with open(file_path, "r", encoding="utf-8") as json_file:
                try:
                    data = json.load(json_file)
                    data["source"] = "cobblemon"
                    data["drops"] = ""
                    data["moves"] = ""
                    combined_data[file] = data
                except json.JSONDecodeError:
                    print(f"Error al decodificar el archivo JSON: {file_path}")

        # Cargar datos del repositorio de ampliación (sobrescribiendo los del original si hay duplicados)
        for file in expansion_files:
            file_path = os.path.join(expansion_repo, file)
            with open(file_path, "r", encoding="utf-8") as json_file:
                try:
                    data = json.load(json_file)
                    data["source"] = "AllTheMons"
                    data["drops"] = ""
                    data["moves"] = ""
                    combined_data[file] = data
                except json.JSONDecodeError:
                    print(f"Error al decodificar el archivo JSON: {file_path}")

        # Crear una lista combinada de todos los datos
        merged_list = list(combined_data.values())

        # Guardar los datos combinados en un archivo JSON
        with open(output_file, "w", encoding="utf-8") as output_json_file:
            json.dump(merged_list, output_json_file, indent=4)

        print(f"Archivo combinado JSON creado correctamente en: {output_file}")
    except OSError as e:
        print(f"Error de sistema: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")

def merge_additional_repositories(original_file, spawn_repo_original, spawn_repo_expansion):
    try:
        # Cargar el archivo combinado principal
        with open(original_file, "r", encoding="utf-8") as json_file:
            main_data = json.load(json_file)

        # Listar archivos en ambos repositorios de spawn
        spawn_original_files = [f for f in os.listdir(spawn_repo_original) 
                                if os.path.isfile(os.path.join(spawn_repo_original, f)) and f.endswith('.json')]
        spawn_expansion_files = [f for f in os.listdir(spawn_repo_expansion) 
                                 if os.path.isfile(os.path.join(spawn_repo_expansion, f)) and f.endswith('.json')]

        # Combinar archivos de spawn por nombre
        spawn_data = {}
        for file in spawn_original_files:
            file_path = os.path.join(spawn_repo_original, file)
            file_name = os.path.splitext(file)[0].lower()  # Quitar extensión para comparación
            with open(file_path, "r", encoding="utf-8") as json_file:
                try:
                    data = json.load(json_file)
                    data["source"] = "Cobblemon"
                    spawn_data[file_name] = data
                except json.JSONDecodeError:
                    print(f"Error al decodificar el archivo JSON: {file_path}")

        for file in spawn_expansion_files:
            file_path = os.path.join(spawn_repo_expansion, file)
            file_name = os.path.splitext(file)[0].lower()  # Quitar extensión para comparación
            with open(file_path, "r", encoding="utf-8") as json_file:
                try:
                    data = json.load(json_file)
                    data["source"] = "AllTheMons"
                    spawn_data[file_name] = data  # Sobrescribir con la expansión
                except json.JSONDecodeError:
                    print(f"Error al decodificar el archivo JSON: {file_path}")

        # Agregar los datos de spawn al archivo principal
        for item in main_data:
            name = item.get("name", "").lower()
            if name in spawn_data:
                item["source"] = spawn_data[name]["source"]
                item["spawns"] = spawn_data[name]

        # Guardar el archivo principal actualizado
        with open(original_file, "w", encoding="utf-8") as json_file:
            json.dump(main_data, json_file, indent=4)

        print(f"Archivo principal actualizado con spawns correctamente en: {original_file}")
    except OSError as e:
        print(f"Error de sistema: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")

# Variables de configuración
original_repo = "./public/data/dex/cobblemon"
expansion_repo = "./public/data/dex/atm"
output_json_file = "./public/data/_index.json"

spawn_repo_original = "./public/data/spawn/cobblemon"
spawn_repo_expansion = "./public/data/spawn/atm"

# Paso 1: Combinar los repositorios originales y de expansión
merge_json_repositories(original_repo, expansion_repo, output_json_file)

# Paso 2: Agregar datos de spawns al archivo combinado
merge_additional_repositories(output_json_file, spawn_repo_original, spawn_repo_expansion)
