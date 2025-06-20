const Parser = require('rss-parser');
const parser = new Parser();

const RSS_FEEDS = [
  'https://www.timesofisrael.com/feed/',
  'https://rss.jpost.com/rss/rssfeedsfrontpage.aspx',
  'https://www.israelnationalnews.com/rss.aspx',
  'https://www.i24news.tv/en/rss',
  'https://www.haaretz.com/cmlink/1.628765'
];

exports.handler = async (event) => {
  console.log('Fetching real RSS feeds...');
  
  try {
    const allItems = [];
    
    // Fetch all feeds in parallel
    const feedPromises = RSS_FEEDS.map(async (feedUrl) => {
      try {
        console.log(`Fetching: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        return feed.items.slice(0, 10).map(item => ({
          title: item.title,
          content: item.contentSnippet || item.content || item.description || '',
          link: item.link,
          pubDate: item.pubDate || item.isoDate,
          source: feed.title || feedUrl,
          guid: item.guid || item.link
        }));
      } catch (error) {
        console.error(`Error fetching ${feedUrl}:`, error.message);
        return [];
      }
    });
    
    const results = await Promise.all(feedPromises);
    results.forEach(items => allItems.push(...items));
    
    console.log(`Total items fetched: ${allItems.length}`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        items: allItems,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('RSS fetch error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        items: []
      }),
    };
  }
};