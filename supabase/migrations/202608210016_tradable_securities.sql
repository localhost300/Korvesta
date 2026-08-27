-- Exchange-listed securities available in Spot and Demo trading. Direct
-- Treasury securities and retirement accounts require separate product flows.
insert into public.assets(symbol,name,coingecko_id,decimals) values
 ('TLT','iShares 20+ Year Treasury Bond ETF',null,4),
 ('SHY','iShares 1-3 Year Treasury Bond ETF',null,4),
 ('LQD','iShares iBoxx Investment Grade Corporate Bond ETF',null,4),
 ('TIP','iShares TIPS Bond ETF',null,4),
 ('IEF','iShares 7-10 Year Treasury Bond ETF',null,4),
 ('VGSH','Vanguard Short-Term Treasury ETF',null,4),
 ('VTI','Vanguard Total Stock Market ETF',null,4),
 ('VEA','Vanguard FTSE Developed Markets ETF',null,4),
 ('VWO','Vanguard FTSE Emerging Markets ETF',null,4),
 ('GLD','SPDR Gold Shares',null,4),
 ('VNQ','Vanguard Real Estate ETF',null,4),
 ('AMZN','Amazon',null,4),
 ('GOOGL','Alphabet',null,4),
 ('META','Meta Platforms',null,4),
 ('JPM','JPMorgan Chase',null,4),
 ('JNJ','Johnson & Johnson',null,4),
 ('XOM','Exxon Mobil',null,4),
 ('KO','Coca-Cola',null,4),
 ('O','Realty Income',null,4),
 ('PLD','Prologis',null,4)
on conflict(symbol) do update set name=excluded.name,decimals=excluded.decimals,enabled=true;
