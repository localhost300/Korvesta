insert into public.assets(symbol,name,coingecko_id,decimals) values
 ('ADA','Cardano','cardano',6),
 ('DOGE','Dogecoin','dogecoin',8),
 ('AVAX','Avalanche','avalanche-2',9),
 ('DOT','Polkadot','polkadot',10),
 ('LINK','Chainlink','chainlink',18),
 ('LTC','Litecoin','litecoin',8),
 ('BCH','Bitcoin Cash','bitcoin-cash',8),
 ('UNI','Uniswap','uniswap',18),
 ('ATOM','Cosmos','cosmos',6),
 ('TRX','TRON','tron',6)
on conflict(symbol) do update set
 name=excluded.name,
 coingecko_id=excluded.coingecko_id,
 decimals=excluded.decimals,
 enabled=true;
