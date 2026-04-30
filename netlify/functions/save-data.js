exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL;   // ex: https://cloud.utc.fr/remote.php/dav/files/flevillain/expe-robot/data.csv
    const NEXTCLOUD_USER = process.env.NEXTCLOUD_USER; // ton identifiant UTC
    const NEXTCLOUD_PASS = process.env.NEXTCLOUD_PASS; // ton mot de passe UTC

    let data;
    try {
        data = JSON.parse(event.body);
    } catch(e) {
        return { statusCode: 400, body: 'Invalid JSON' };
    }

    // Construire la ligne CSV à partir des données d'une condition
    const condition = data.condition;
    const row = [
        data.participantId,
        data.age,
        data.gender,
        data.startTime,
        condition.order,
        condition.points,
        condition.mode,
        condition.showMarkers,
        condition.responses.animacy,
        condition.responses.intentionality,
        condition.responses.predictability,
        condition.responses.intelligence,
        condition.timing.totalTimeMs,
        condition.timing.timeToFirstResponseMs,
        condition.timestamp
    ].join(',');

    // Récupérer le fichier CSV existant
    const getResponse = await fetch(NEXTCLOUD_URL, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(NEXTCLOUD_USER + ':' + NEXTCLOUD_PASS).toString('base64')
        }
    });

    let csvContent = '';
    const header = 'participantId,age,gender,startTime,conditionOrder,points,mode,showMarkers,animacy,intentionality,predictability,intelligence,totalTimeMs,timeToFirstResponseMs,timestamp\n';

    if (getResponse.ok) {
        csvContent = await getResponse.text();
    } else {
        // Fichier inexistant : on crée l'en-tête
        csvContent = header;
    }

    // Ajouter la nouvelle ligne
    csvContent += row + '\n';

    // Écrire le fichier mis à jour
    const putResponse = await fetch(NEXTCLOUD_URL, {
        method: 'PUT',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(NEXTCLOUD_USER + ':' + NEXTCLOUD_PASS).toString('base64'),
            'Content-Type': 'text/csv'
        },
        body: csvContent
    });

    if (putResponse.ok) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true })
        };
    } else {
        return {
            statusCode: 500,
            body: 'Erreur écriture Nextcloud : ' + putResponse.status
        };
    }
};
