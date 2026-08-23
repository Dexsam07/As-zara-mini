const axios = require('axios');
const { igdl } = require('ruhend-scraper');
const { facebookdl } = require('@bochilteam/scraper-facebook');

const HEADERS = {
  accept: '*/*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function raceProviders(providers) {
  const attempts = providers.map(provider => Promise.resolve()
    .then(provider.run)
    .then(result => {
      if (!result) throw new Error(`${provider.name} returned no result`);
      return { ...result, provider: provider.name };
    }));
  try {
    return await Promise.any(attempts);
  } catch (error) {
    const reasons = error.errors?.map(item => item.message).join('; ') || 'all providers failed';
    throw new Error(`all providers failed: ${reasons}`);
  }
}

async function getInstagramDownload(url) {
  const encoded = encodeURIComponent(url);
  return raceProviders([
    {
      name: 'Adeel-Xtech',
      run: async () => {
        const response = await axios.get(`https://adeel-xtech-apis.vercel.app/api/igdl?url=${encoded}`, { timeout: 20000, headers: HEADERS });
        const rows = response.data?.result;
        if (!response.data?.status || !Array.isArray(rows)) throw new Error('invalid Adeel Instagram response');
        const data = rows.filter(item => item?.download_url).map(item => ({ url: item.download_url, type: item.type || 'video' }));
        if (!data.length) throw new Error('Adeel Instagram returned no media');
        return { data };
      }
    },
    {
      name: 'Ruhend scraper',
      run: async () => {
        const response = await igdl(url);
        if (!response?.data?.length) throw new Error('Ruhend returned no media');
        return { data: response.data.filter(item => item?.url) };
      }
    }
  ]);
}

async function getFacebookDownload(url) {
  const encoded = encodeURIComponent(url);
  return raceProviders([
    {
      name: 'Siputzx',
      run: async () => {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/facebook?url=${encoded}`, { timeout: 20000, headers: HEADERS });
        const data = response.data?.data;
        const downloads = data?.downloads?.filter(item => item?.type === 'video' && item?.url) || [];
        if (!response.data?.status || !downloads.length) throw new Error('Siputzx returned no video');
        const selected = downloads[0];
        return {
          duration: data.duration,
          title: data.title,
          video: [{ quality: selected.quality, download: async () => selected.url }]
        };
      }
    },
    {
      name: 'Bochil scraper',
      run: async () => {
        const response = await facebookdl(url);
        if (!response?.video?.length) throw new Error('Bochil returned no video');
        return response;
      }
    }
  ]);
}

module.exports = { getInstagramDownload, getFacebookDownload };
