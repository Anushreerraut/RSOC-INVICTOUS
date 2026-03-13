import asyncio
import httpx
from app.scanner.modules import mass_assignment

async def run():
    async with httpx.AsyncClient() as c:
        res = await mass_assignment.check_mass_assignment(c, 'https://httpbin.org/post', 'POST', {})
        print("Findings from httpbin:", res)

if __name__ == '__main__':
    asyncio.run(run())
