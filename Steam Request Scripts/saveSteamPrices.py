import steammarket
from pymongo import MongoClient
import certifi

ca_cert_path = certifi.where()
mongo_uri = "mongodb+srv://mainuser:Z4zTd7YBor9Txrxm@csgo-database.l6hsda9.mongodb.net/test?retryWrites=true&w=majority&tlsCAFile=" + ca_cert_path
database_name = 'test'
collection_name = 'itemData'
field_name = 'name'  # The field you want to grab
price_output_file = 'skinHashNames.txt'  # The file where you want to save the values
modified_name_file = 'modifiedNames.txt' # The file where you want to save the modified names

# Connect to the MongoDB client
client = MongoClient(mongo_uri)

# Connect to the database and collection
db = client[database_name]
collection = db[collection_name]

items = []
# Phrases to remove
phases = ["Phase 1 ", "Phase 2 ", "Phase 3 ", "Phase 4 "]

# Open the file in append mode
with open(price_output_file, 'a') as file:
    # Iterate through the collection
    for document in collection.find():
        # Grab the value field
        value = document.get(field_name, None)  # Replace 'value' with your field name
        if value is not None:
            for phase in phases:
                # Write the value to the file followed by a newline
                item = item.replace(phase, '')  # Remove the phase
                file.write(f"{value}\n")
                items.append(value)

# Close the connection
client.close()

# Dictionary to hold original and processed items
processed_dict = {}

# Process each item in the list
for item in items:
    original_item = item  # Keep the original item
    for phase in phases:
        item = item.replace(phase, '')  # Remove the phase
        processed_dict[original_item] = item.strip()  # Strip to remove any leading/trailing whitespace
    
# Open the file in append mode
with open(modified_name_file, 'a') as file:
    # Iterate through the collection
    for item in processed_dict.values():
        file.write(f"{item}\n")
        
"""
# Print or use the dictionary
for original, processed in processed_dict.items():
    print(f"Original: {original}\nProcessed: {processed}\n")


itemCount = 0
for item in items:
    itemValue = steammarket.get_csgo_item(item, currency="USD")
"""

#item = steammarket.get_csgo_item("Sticker | iBUYPOWER | Katowice 2014", currency="USD")


#itemValues = steammarket.get_multiple(items, appid=730, currency="USD")
#print(itemValues)