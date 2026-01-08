/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        serverActions: {
            bodySizeLimit: '100mb'
        },
        serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@pdf-lib/fontkit', 'pdf-lib']
    }
};

export default nextConfig;
