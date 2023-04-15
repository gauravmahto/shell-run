import { promisify } from 'node:util';
import { spawn, exec as e } from 'node:child_process';
import { stat } from 'node:fs/promises';

const exec = promisify(e);

export const filePath = '/var/www/nextcloud/data/home/files/Documents/scan.jpg';

const fileDate = ['date', '-r', filePath, '+"%Y%m%d_%H%M%S"'];
const scanSpawnCmd = ['/usr/bin/hp-scan', '--mode=color', '-r', '300', `--output=${filePath}`];

let scanOngoing = false;

function scan(cb) {

  let resCb;
  let rejCb;

  const qPromise = new Promise((res, rej) => {

    resCb = res;
    rejCb = rej;

  });

  const spawnObj = spawn('sudo', scanSpawnCmd);

  scanOngoing = true;

  spawnObj.stdout.on('data', (data) => {

    console.log(`stdout: ${data}`);
    cb(`stdout: ${data}`);

  });

  spawnObj.stderr.on('data', (data) => {

    console.error(`stderr: ${data}`);
    cb(`stderr: ${data}`);

  });

  spawnObj.on('close', (code) => {

    console.log(`child process exited with code ${code}`);
    cb(`stdend: child process exited with code ${code}`);

    resCb(code);

  });

  return qPromise;

}

const renCmd = `sudo mv -n ${filePath} "/var/www/nextcloud/data/home/files/Documents/scan_$(sudo date -r ${filePath} +"%Y%m%d_%H%M%S").jpg"`;
const scanCmd = `sudo /usr/bin/hp-scan --mode=color -r 300 --output=${filePath}`;
const ownCmd = 'sudo find /var/www/nextcloud/data/home/files/Documents -type f | xargs sudo chown www-data:www-data';
const modAndUpdateCloudCmd = 'sudo find /var/www/nextcloud/data/home/files/Documents -type f | xargs sudo chmod 644 && sudo -u www-data php /var/www/nextcloud/occ files:scan --all';

async function getScanFileStat(filePath) {

  try {

    return await stat(filePath);

  } catch (err) {

    console.error(`File stat failed with error ${err}`);

  }

}

async function getUser() {

  console.log(`Getting user`);

  const { stdout, stderr } = await exec('whoami');

  console.log('stdout:', stdout);

  console.error('stderr:', stderr);

}

async function renameFile(cb) {

  const result = await getScanFileStat(filePath);

  if (!result?.isFile()) {

    console.warn(`${filePath} is not available. Skipping renaming.`);

    return;

  }

  console.log(`Renaming ${filePath}`);
  cb(`Renaming ${filePath}`);

  const { stdout, stderr } = await exec(renCmd);

  console.log('stdout:', stdout);
  cb(`stdout: ${stdout}`);

  console.error('stderr:', stderr);
  cb(`stderr: ${stdout}`);

}

async function ownScannedFile(cb) {

  console.log('Owning scanned file');
  cb('Owning scanned file');

  const { stdout, stderr } = await exec(ownCmd);

  console.log('stdout:', stdout);
  cb(`stdout: ${stdout}`);

  console.error('stderr:', stderr);
  cb(`stderr: ${stdout}`);

}

async function updateCloud(cb) {

  console.log('Updating nextcloud files');
  cb('Updating nextcloud files');

  const { stdout, stderr } = await exec(modAndUpdateCloudCmd);

  console.log('stdout:', stdout);
  cb(`stdout: ${stdout}`);

  console.error('stderr:', stderr);
  cb(`stderr: ${stdout}`);

}

function acquireLock() {

  return !scanOngoing;

}

export async function performScan(cb) {

  if (acquireLock()) {

    try {

      scanOngoing = true;

      await getUser();

      await renameFile(cb);

      await scan(cb);

      await ownScannedFile(cb);

      await updateCloud(cb);

      scanOngoing = false;

    } catch (err) {

      console.error(`Scan error: ${err}`);

      scanOngoing = false;

      throw err;

    }

  } else {

    throw new Error('Ongoing Scan error .. please retry after sometime');

  }

}

export async function checkScannedFilePresence() {

  const result = await getScanFileStat(filePath);

  if (!result?.isFile()) {

    console.warn(`${filePath} is not available. Skipping download.`);

    return false;

  }

  return true;

}
