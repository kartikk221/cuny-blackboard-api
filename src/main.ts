import HyperExpress from 'hyper-express';
import 'dotenv/config';

const webserver = new HyperExpress.Server();
const PORT = process.env.PORT;

webserver.get('/', (req, res) => res.send('Hello World'));

(async () => {
	await webserver.listen(Number(PORT));
	console.log(`listening on port ${PORT}`);
})();
