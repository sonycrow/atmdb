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
                    data["source"] = "original"
                    combined_data[file] = data
                except json.JSONDecodeError:
                    print(f"Error al decodificar el archivo JSON: {file_path}")

        # Cargar datos del repositorio de ampliación (sobrescribiendo los del original si hay duplicados)
        for file in expansion_files:
            file_path = os.path.join(expansion_repo, file)
            with open(file_path, "r", encoding="utf-8") as json_file:
                try:
                    data = json.load(json_file)
                    data["source"] = "expansion"
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

# Variables de configuración
original_repo = "./public/data/cobblemon"
expansion_repo = "./public/data/atm"
output_json_file = "./public/data/_index.json"

merge_json_repositories(original_repo, expansion_repo, output_json_file)
