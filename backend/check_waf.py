import asyncio
import httpx
from app.scanner.modules import waf_detector

async def run():
    async with httpx.AsyncClient() as c:
        res = await waf_detector.check_waf_ips(c, 'https://cloudflare.com', 'GET', {})
        print(res)

if __name__ == '__main__':
    asyncio.run(run())
