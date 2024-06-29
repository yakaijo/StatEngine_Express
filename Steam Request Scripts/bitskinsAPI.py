from datetime import datetime
import requests
import json
from pymongo import MongoClient
import certifi

ca_cert_path = certifi.where()
auth_key = '11bd85216dbf65ea2cd9b8c97e2cbda3e77789659ac0c53d9270f96aef38a3d6'

headers = {'x-apikey': auth_key}
res = requests.get('https://api.bitskins.com/market/skin/730', headers=headers)
response = json.loads(res.text)
print(response)


# Connect to the MongoDB instance
client = MongoClient("mongodb+srv://mainuser:Z4zTd7YBor9Txrxm@csgo-database.l6hsda9.mongodb.net/test?retryWrites=true&w=majority&tlsCAFile=" + ca_cert_path)  # Adjust this if your MongoDB instance is elsewhere
db = client['test']  # Name of the database
collection = db['itemData']  # Name of the collection

for item in response:
    name = item['name']
    price = item['suggested_price']
    bson_timestamp = datetime.utcnow()
    # Inserting data into the collection
    existing_item = collection.find_one({"name": name, "suggested_price": None, "timestamp": bson_timestamp})
    
    if existing_item and price != None:
        # Update the price for the existing item
        collection.update_one({"name": name}, {"$set": {"suggested_price": price, "timestamp": bson_timestamp}})
    else:
        # Insert new item into the collection
        if price != None:
            collection.insert_one({"name": name, "suggested_price": price, "timestamp": bson_timestamp})

print("Data inserted successfully!")

