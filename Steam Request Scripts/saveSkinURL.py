import csv
from pymongo import MongoClient
import certifi 

# Configurations
ca_cert_path = certifi.where()
TEXT_FILE = 'csgo_skins_data.txt'
IMAGE_URL_PREFIX = "http://cdn.steamcommunity.com/economy/image/"

# Connect to the MongoDB instance
client = MongoClient("mongodb+srv://mainuser:Z4zTd7YBor9Txrxm@csgo-database.l6hsda9.mongodb.net/test?retryWrites=true&w=majority&tlsCAFile=" + ca_cert_path)  # Adjust this if your MongoDB instance is elsewhere
db = client['test']  # Name of the database
collection = db['itemData']  # Name of the collection
count = 0

debuggingLog = []
# Item wears and phases to help with modifying search strings
item_wears = ["(Factory New)", "(Minimal Wear)", "(Field-Tested)", "(Well-Worn)", "(Battle-Scarred)"]
phases = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"]

with open(TEXT_FILE, 'r') as file:
    count = 0
    for line in file:
        clean_line = line.strip().strip('"') 
        # Split the line by comma to get market hash name, image url suffix, and steam price
        parts = clean_line.split(',')
        # This causes some stickers to be ignored since they have commas in their names, for example:
        # Skipping malformed line: Sticker | Rock, Paper, Scissors (Foil),-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXQ9QVcJY8gulROXF7ZSeP_h52BHE97Jg9opru1LhVfwPDBYi5N_s-Jko-Cm7msMe-AwzoF6pcn07mXrIrwiVK38kdkZDv1dY_EIAM9N1-F_1O3xey8m9bi6wTQBivm,300
        if len(parts) != 3:
            print(f"Skipping malformed line: {clean_line}")
            continue
        market_hash_name, image_url_suffix, steam_price = parts
        full_image_url = IMAGE_URL_PREFIX + image_url_suffix.strip()
        
        # Find the document with the given market hash name
        print(f"Looking for document with market hash name: {market_hash_name}")    
        doc = collection.find_one({'name': market_hash_name})
        # If found, update the document with the full image url and steam price
        if doc:
            update_data = {
                'image_url': full_image_url,
                'steam_price': steam_price.strip()
            }
            collection.update_one({'_id': doc['_id']}, {'$set': update_data})
            print(f"Count: {count} Updated document with market hash name: {market_hash_name}")
            debuggingLog.append(f"Count: {count} Updated document with market hash name: {market_hash_name}")
            count += 1
            
        # Find the document with the given market hash name and phase
        for phase in phases:
            for wear in item_wears:
                if wear in market_hash_name:
                    # Insert the phase before the wear value
                    updated_hash_name = market_hash_name.replace(wear, f"{phase} {wear}")
            doc = collection.find_one({'name': updated_hash_name})
            if doc:
                update_data = {
                    'image_url': full_image_url,
                    'steam_price': steam_price.strip()
                }
                collection.update_one({'_id': doc['_id']}, {'$set': update_data})
                print(f"Count: {count} Updated document with market hash name: {updated_hash_name}")
                debuggingLog.append(f"Count: {count} Updated document with market hash name: {updated_hash_name}")
                count += 1
                
#writing debugging log to file

with open('debuggingLog.txt', 'w') as file:
    for line in debuggingLog:
        file.write(line + '\n')

"""
with open(TEXT_FILE, 'r') as file:
    for line in file:
        clean_line = line.strip().strip('"')
        # Split the line by comma to get market hash name and image url suffix
        market_hash_name, image_url_suffix = clean_line.strip().split(',', 1)
        full_image_url = IMAGE_URL_PREFIX + image_url_suffix

        # Find the document with the given market hash name
        print("Looking for document with market hash name: " + market_hash_name)    
        doc = collection.find_one({'name': market_hash_name})                       

        # If found, update the document with the full image url
        if doc:
            collection.update_one({'_id': doc['_id']}, {'$set': {'image_url': full_image_url}})
            print('Count: ' + str(count) + ' Updated document with market hash name: ' + market_hash_name)
            count += 1
"""

# Close the connection
client.close()
