const express = require('express');
const axios = require('axios');
const path = require('path');
const { crypto } = require('node:crypto');

// Replacement for uuid v4 in CommonJS
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-11e10).replace(/[018]/g, c =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Viu Class
class Viu {
    constructor() {
        this.inst = axios.create({
            baseURL: 'https://api-gateway-global.viu.com/api',
            headers: {
                'accept-encoding': 'gzip',
                'content-type': 'application/x-www-form-urlencoded',
                platform: 'android',
                'user-agent': 'okhttp/4.12.0'
            }
        });
        
        this.token = null;
    }
    
    getToken = async function () {
        try {
            const { data } = await this.inst.post('/auth/token', {
                countryCode: 'ID',
                platform: 'android',
                platformFlagLabel: 'phone',
                language: '8',
                deviceId: uuidv4(),
                dataTrackingDeviceId: uuidv4(),
                osVersion: '28',
                appVersion: '2.21.0',
                buildVersion: '770',
                carrierId: '72',
                carrierName: 'Telkomsel',
                appBundleId: 'com.vuclip.viu',
                vuclipUserId: '',
                deviceBrand: 'vivo',
                deviceModel: 'V2242A',
                flavour: 'all'
            });
            
            this.token = data.token;
            this.inst.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            
            return data.token;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    home = async function () {
        try {
            if (!this.token) await this.getToken();
            
            const { data } = await this.inst.get('/mobile', {
                params: {
                    r: '/home/index',
                    platform_flag_label: 'phone',
                    language_flag_id: '8',
                    ut: '0',
                    area_id: '1000',
                    os_flag_id: '2',
                    countryCode: 'ID'
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    search = async function (query, { page = '1', count = '18' } = {}) {
        try {
            if (!query) throw new Error('Query is required.');
            if (isNaN(page)) throw new Error('Invalid page.');
            if (isNaN(count)) throw new Error('Invalid count.');
            if (!this.token) await this.getToken();
            
            const { data } = await this.inst.get('/mobile', {
                params: {
                    r: '/search/video',
                    limit: count,
                    page: page,
                    'keyword[]': query,
                    platform_flag_label: 'phone',
                    language_flag_id: '8',
                    ut: '0',
                    area_id: '1000',
                    os_flag_id: '2',
                    countryCode: 'ID'
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    detail = async function (productId) {
        try {
            if (!productId) throw new Error('Product ID is required.');
            if (!this.token) await this.getToken();
            
            const { data } = await this.inst.get('/mobile', {
                params: {
                    r: '/vod/detail',
                    product_id: productId,
                    platform_flag_label: 'phone',
                    language_flag_id: '8',
                    ut: '0',
                    area_id: '1000',
                    os_flag_id: '2',
                    countryCode: 'ID'
                }
            });
            
            const { data: ep } = await this.inst.get('/mobile', {
                params: {
                    r: '/vod/product-list',
                    product_id: productId,
                    series_id: data.data.series.series_id,
                    platform_flag_label: 'phone',
                    language_flag_id: '8',
                    ut: '0',
                    area_id: '1000',
                    os_flag_id: '2',
                    countryCode: 'ID'
                }
            });
            
            return {
                metadata: data.data,
                product_list: ep.data.product_list
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    stream = async function (ccsProductId) {
        try {
            if (!ccsProductId) throw new Error('CCS Product ID is required.');
            if (!this.token) await this.getToken();
            
            const { data } = await this.inst.get('/playback/distribute', {
                params: {
                    ccs_product_id: ccsProductId,
                    platform_flag_label: 'phone',
                    language_flag_id: '8',
                    ut: '0',
                    area_id: '1000',
                    os_flag_id: '2',
                    countryCode: 'ID'
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

const viu = new Viu();

// Helper for error responses
const errorResponse = (res, message, status = 400) => {
    res.status(status).json({ success: false, error: message });
};

// Routes

// Documentation Page
app.get('/', (req, res) => {
    res.render('index');
});

// Test/Playground Page
app.get('/test', (req, res) => {
    res.render('test');
});

// API: Home
app.get('/api/home', async (req, res) => {
    try {
        const data = await viu.home();
        res.json({ success: true, data });
    } catch (error) {
        errorResponse(res, error.message);
    }
});

// API: Search
app.get('/api/search', async (req, res) => {
    try {
        const { q, page = '1', count = '18' } = req.query;
        if (!q) return errorResponse(res, 'Query parameter (q) is required');
        
        const data = await viu.search(q, { page, count });
        res.json({ success: true, data });
    } catch (error) {
        errorResponse(res, error.message);
    }
});

// API: Detail
app.get('/api/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return errorResponse(res, 'Product ID is required');
        
        const data = await viu.detail(id);
        res.json({ success: true, data });
    } catch (error) {
        errorResponse(res, error.message);
    }
});

// API: Stream URL
app.get('/api/stream/:ccsProductId', async (req, res) => {
    try {
        const { ccsProductId } = req.params;
        if (!ccsProductId) return errorResponse(res, 'CCS Product ID is required');
        
        const data = await viu.stream(ccsProductId);
        res.json({ success: true, data });
    } catch (error) {
        errorResponse(res, error.message);
    }
});

// 404 Handler
app.use((req, res, next) => {
    if (req.path === '/favicon.ico' || req.path === '/favicon.png') {
        return res.status(204).end();
    }
    res.status(404).render('404');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Viu API Server running at http://0.0.0.0:${PORT}`);
});
