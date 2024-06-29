const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const app = express();

const port = 3000;
const mongoUri = 'mongodb+srv://mainuser:Z4zTd7YBor9Txrxm@csgo-database.l6hsda9.mongodb.net/'; // Replace with your MongoDB URI
const dbName = 'test';
const usersCollectionName = 'users';
const itemDataCollectionName = 'itemData';

async function makeRequestWithRetry(url, retries = 3, delay = 3000) {
    try {
        return await axios.get(url);
    } catch (error) {
        if (retries > 0 && error.response && error.response.status === 429) {
            const newDelay = delay * 2; // Double the delay each time
            console.log(`Request rate limited. Retrying after ${newDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, newDelay));
            return makeRequestWithRetry(url, retries - 1, newDelay);
        }
        throw error;
    }
}

app.post('/update_inventory', async (req, res) => {
    const steamId = req.query.steam_id;
    if (!steamId) {
        return res.status(400).send({ message: 'Steam ID is required' });
    }

    try {
        const inventoryResponse = await makeRequestWithRetry(`https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=5000`);
        const inventoryData = inventoryResponse.data;
        const marketHashNames = inventoryData.descriptions.map(item => item.market_hash_name);

        const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const usersCollection = db.collection(usersCollectionName);
        const itemDataCollection = db.collection(itemDataCollectionName);

        const items = (await Promise.all(
            marketHashNames.map(async (name) => {
                return itemDataCollection.findOne({ name: name });
            })
        )).filter(item => item); // Filter out null/undefined items

        await usersCollection.updateOne(
            { steamID: steamId },
            { $set: { inventory: items } },
            { upsert: false }
        );

        client.close();

        return res.status(200).send({ message: `Inventory of Steam ID ${steamId} has been updated in MongoDB.` });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error updating inventory' });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


/** 
app.post('/update_inventory', async (req, res) => {
    const steamId = req.query.steam_id;
    if (!steamId) {
        return res.status(400).send({ message: 'Steam ID is required' });
    }

    try {
        const inventoryResponse = await axios.get(`https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=5000`);
        const inventoryData = inventoryResponse.data;
        const marketHashNames = inventoryData.descriptions.map(item => item.market_hash_name);

        const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        await collection.updateOne(
            { steamID: steamId },
            { $set: { inventory: marketHashNames } },
            { upsert: false }
        );

        client.close();

        return res.status(200).send({ message: `Inventory of Steam ID ${steamId} has been updated in MongoDB.` });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error updating inventory' });
    }
});
*/