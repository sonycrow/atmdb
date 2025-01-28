import os
import json

def list_files_to_json(directory, output_file):
    try:
        # Comprobar si el directorio existe
        if not os.path.isdir(directory):
            raise OSError(f"El directorio '{directory}' no existe o no es accesible.")

        # Listar todos los archivos en el directorio, excluyendo '_index.json' y archivos que no sean .json
        files = [f for f in os.listdir(directory) 
                 if os.path.isfile(os.path.join(directory, f)) and f.endswith('.json') and f != '_index.json']

        # Unir el contenido de los archivos .json en un único archivo
        combined_data = []
        for file in files:
            file_path = os.path.join(directory, file)
            with open(file_path, "r", encoding="utf-8") as json_file:
                try:
                    data = json.load(json_file)
                    combined_data.append(data)
                except json.JSONDecodeError:
                    print(f"Error al decodificar el archivo JSON: {file_path}")

        # Guardar los datos combinados en un archivo JSON
        with open(output_file, "w", encoding="utf-8") as output_json_file:
            json.dump(combined_data, output_json_file, indent=4)

        print(f"Archivo combinado JSON creado correctamente en: {output_file}")
    except OSError as e:
        print(f"Error de sistema: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")

# Variables de configuración
directory_to_read = "./public/data/atmdb"
output_json_file = "./public/data/_index.json"

list_files_to_json(directory_to_read, output_json_file)
