import steammarket
import json
from pymongo import MongoClient
import certifi

ca_cert_path = certifi.where()
mongo_uri = "mongodb+srv://mainuser:Z4zTd7YBor9Txrxm@csgo-database.l6hsda9.mongodb.net/test?retryWrites=true&w=majority&tlsCAFile=" + ca_cert_path
database_name = 'test'
collection_name = 'itemData'
field_name = 'name'  # The field you want to grab
output_file = 'skinHashNames.txt'  # The file where you want to save the values

# Connect to the MongoDB client
client = MongoClient(mongo_uri)

# Connect to the database and collection
db = client[database_name]
collection = db[collection_name]

# Open the file in append mode
with open(output_file, 'a') as file:
    # Iterate through the collection
    for document in collection.find():
        # Grab the value field
        value = document.get(field_name, None)  # Replace 'value' with your field name
        if value is not None:
            # Write the value to the file followed by a newline
            file.write(f"{value}\n")
            print(value)

# Close the connection
client.close()

item = steammarket.get_csgo_item("Sticker | iBUYPOWER | Katowice 2014", currency="USD")

print(item)