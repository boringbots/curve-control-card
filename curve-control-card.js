// Curve Control Temperature Schedule Card
// Custom card for Home Assistant to display temperature schedule with electricity prices

class CurveControlCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentTab = 'display';
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    
    // Auto-refresh every 15 seconds if data is pending
    if (this.isDataPending(hass)) {
      if (!this._refreshTimer) {
        this._refreshTimer = setInterval(() => {
          if (!this.isDataPending(this._hass)) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
          }
          this.updateDisplay();
        }, 15000);
      }
    } else if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
    
    if (!this.shadowRoot.lastElementChild) {
      this.shadowRoot.innerHTML = `
        <style>
          .card {
            padding: 16px;
            background: var(--ha-card-background, var(--card-background-color, white));
            border-radius: var(--ha-card-border-radius, 4px);
            box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, 0.14));
          }
          .header {
            font-size: 1.2em;
            font-weight: 500;
            margin-bottom: 16px;
          }
          .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 8px;
            background: var(--secondary-background-color);
            border-radius: 4px;
          }
          .toggle-label {
            font-weight: 500;
          }
          .status-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
          }
          .status-item {
            padding: 8px;
            background: var(--secondary-background-color);
            border-radius: 4px;
            text-align: center;
          }
          .status-value {
            font-size: 1.4em;
            font-weight: bold;
            color: var(--primary-color);
          }
          .status-label {
            font-size: 0.9em;
            color: var(--secondary-text-color);
            margin-top: 4px;
          }
          .chart-container {
            position: relative;
            height: 300px;
            margin-top: 16px;
          }
          canvas {
            width: 100% !important;
            height: 100% !important;
          }
          .no-data {
            text-align: center;
            padding: 32px;
            color: var(--secondary-text-color);
          }
          .chart-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            max-width: 200px;
          }
          ha-switch {
            --mdc-theme-secondary: var(--switch-checked-color);
          }
          .tabs {
            display: flex;
            border-bottom: 1px solid var(--divider-color);
            margin-bottom: 16px;
          }
          .tab {
            padding: 8px 16px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--secondary-text-color);
            font-size: 14px;
            border-bottom: 2px solid transparent;
          }
          .tab.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
          }
          .tab-content {
            display: none;
          }
          .tab-content.active {
            display: block;
          }
          .input-group {
            margin: 12px 0;
          }
          .input-group label {
            display: block;
            font-weight: 500;
            margin-bottom: 4px;
          }
          .input-group input, .input-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            background: var(--card-background-color);
            color: var(--primary-text-color);
          }
          .input-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .detailed-schedule {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-top: 12px;
          }
          .hour-input {
            text-align: center;
            font-size: 12px;
          }
          .hour-label {
            font-size: 10px;
            text-align: center;
            color: var(--secondary-text-color);
            margin-bottom: 4px;
          }
          .action-buttons {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            justify-content: flex-end;
          }
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .btn-primary {
            background: var(--primary-color);
            color: white;
          }
          .btn-secondary {
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
            border: 1px solid var(--divider-color);
          }
        </style>
        <ha-card class="card">
          <div class="header">Curve Control Energy Optimizer</div>
          
          <div class="tabs">
            <button class="tab active" data-tab="display">Dashboard</button>
            <button class="tab" data-tab="basic">Basic Settings</button>
            <button class="tab" data-tab="detailed">Custom Hourly Comfort Ranges</button>
          </div>

          <!-- Dashboard Tab -->
          <div class="tab-content active" id="display-tab">
            <div class="toggle-row">
              <span class="toggle-label">Use Optimized Schedule</span>
              <ha-switch id="optimization-toggle"></ha-switch>
            </div>
            <div class="status-row">
              <div class="status-item">
                <div class="status-value" id="savings-value">--</div>
                <div class="status-label">Energy Savings</div>
              </div>
              <div class="status-item">
                <div class="status-value" id="co2-value">--</div>
                <div class="status-label">CO2 Avoided</div>
              </div>
            </div>
            <div class="status-row">
              <div class="status-item">
                <div class="status-value" id="next-temp-value">--</div>
                <div class="status-label">Next Temperature</div>
              </div>
              <div class="status-item">
                <div class="status-value" id="status-value">--</div>
                <div class="status-label">Status</div>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="schedule-chart"></canvas>
              <div id="chart-tooltip" class="chart-tooltip"></div>
              <div id="no-data" class="no-data" style="display:none;">
                No schedule data available. Optimization will run at midnight or when you update preferences.
              </div>
            </div>
          </div>

          <!-- Basic Settings Tab -->
          <div class="tab-content" id="basic-tab">
            <div class="input-group">
              <label>Home Size (sq ft)</label>
              <input type="number" id="home-size" min="500" max="10000" value="2000">
            </div>
            <div class="input-group">
              <label>Target Temperature (°F)</label>
              <input type="number" id="target-temp" min="65" max="80" value="72" step="0.5">
            </div>
            <div class="input-group">
              <label>Location/Rate Plan</label>
              <select id="location">
                <option value="1">San Diego Gas & Electric TOU-DR1</option>
                <option value="2">San Diego Gas & Electric TOU-DR2</option>
                <option value="3">San Diego Gas & Electric TOU-DR-P</option>
                <option value="4">San Diego Gas & Electric TOU-ELEC</option>
                <option value="5">San Diego Gas & Electric Standard DR</option>
                <option value="6">New Hampshire TOU Whole House</option>
                <option value="7">Texas XCEL Time-Of-Use</option>
                <option value="8">NYC ConEdison Residential TOU</option>
              </select>
            </div>
            <div class="input-row">
              <div class="input-group">
                <label>Time Away</label>
                <input type="time" id="time-away" value="08:00">
              </div>
              <div class="input-group">
                <label>Time Home</label>
                <input type="time" id="time-home" value="17:00">
              </div>
            </div>
            <div class="input-group">
              <label>Savings Level</label>
              <select id="savings-level">
                <option value="1">Low (2°F variation)</option>
                <option value="2" selected>Medium (6°F variation)</option>
                <option value="3">High (12°F variation)</option>
              </select>
            </div>
            <div class="action-buttons">
              <button class="btn btn-secondary" id="reset-basic">Reset</button>
              <button class="btn btn-primary" id="apply-basic">Apply Settings</button>
            </div>
          </div>

          <!-- Detailed Schedule Tab -->
          <div class="tab-content" id="detailed-tab">
            <div class="input-group">
              <label>Detailed Comfort Preferences (24 hours)</label>
              <div class="detailed-schedule" id="detailed-schedule">
                <!-- Will be populated by JavaScript -->
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn btn-secondary" id="reset-detailed">Reset to Defaults</button>
              <button class="btn btn-primary" id="apply-detailed">Apply Custom Schedule</button>
            </div>
          </div>
        </ha-card>
      `;
    }

    this.updateCard();
    this.setupEventListeners();
  }

  updateCard() {
    if (!this._hass) return;

    const switchEntity = this._hass.states['switch.curve_control_energy_optimizer_use_optimized_temperatures'];
    const savingsEntity = this._hass.states['sensor.curve_control_energy_optimizer_energy_savings'];
    const statusEntity = this._hass.states['sensor.curve_control_energy_optimizer_optimization_status'];
    const chartEntity = this._hass.states['sensor.curve_control_energy_optimizer_temperature_schedule_chart'];
    const co2Entity = this._hass.states['sensor.curve_control_energy_optimizer_co2_avoided'];
    const nextTempEntity = this._hass.states['sensor.curve_control_energy_optimizer_next_temperature_setpoint'];

    // Update toggle
    const toggle = this.shadowRoot.getElementById('optimization-toggle');
    if (toggle && switchEntity) {
      toggle.checked = switchEntity.state === 'on';
      
      // Remove existing listeners to prevent duplication
      if (toggle._curveControlHandler) {
        toggle.removeEventListener('click', toggle._curveControlHandler);
      }
      
      // Add new handler
      toggle._curveControlHandler = () => {
        const currentState = switchEntity.state === 'on';
        this._hass.callService('switch', currentState ? 'turn_off' : 'turn_on', {
          entity_id: 'switch.curve_control_energy_optimizer_use_optimized_temperatures'
        });
      };
      
      toggle.addEventListener('click', toggle._curveControlHandler);
    }

    // Update savings
    const savingsValue = this.shadowRoot.getElementById('savings-value');
    if (savingsValue && savingsEntity) {
      savingsValue.textContent = `$${savingsEntity.state || '0'}`;
    }

    // Update CO2 Avoided
    const co2Value = this.shadowRoot.getElementById('co2-value');
    if (co2Value && co2Entity) {
      co2Value.textContent = `${co2Entity.state || '0'} metric tons`;
    }

    // Update Next Temperature
    const nextTempValue = this.shadowRoot.getElementById('next-temp-value');
    if (nextTempValue && nextTempEntity) {
      const temp = parseFloat(nextTempEntity.state);
      nextTempValue.textContent = !isNaN(temp) ? `${temp.toFixed(1)}°F` : '--°F';
    }

    // Update status
    const statusValue = this.shadowRoot.getElementById('status-value');
    if (statusValue && statusEntity) {
      statusValue.textContent = statusEntity.state || 'Unknown';
      statusValue.style.color = statusEntity.state === 'Optimized' ? '#4caf50' : 
                               statusEntity.state === 'Active' ? '#ff9800' : 
                               'var(--primary-color)';
    }

    // Update chart
    if (chartEntity && chartEntity.attributes.graph_data) {
      this.drawChart(chartEntity.attributes.graph_data);
      this.shadowRoot.getElementById('no-data').style.display = 'none';
      this.shadowRoot.getElementById('schedule-chart').style.display = 'block';
    } else {
      // Check if optimization is pending
      const statusEntity = this._hass.states['sensor.curve_control_energy_optimizer_status'];
      const noDataDiv = this.shadowRoot.getElementById('no-data');
      
      if (statusEntity && statusEntity.state === 'Pending') {
        noDataDiv.innerHTML = 'Calculating optimal schedule... Please wait.';
      } else {
        noDataDiv.innerHTML = 'No schedule data available. Optimization will run at midnight or when you update preferences.';
      }
      
      this.shadowRoot.getElementById('no-data').style.display = 'block';
      this.shadowRoot.getElementById('schedule-chart').style.display = 'none';
    }
  }
  
  isDataPending(hass) {
    if (!hass) return false;
    const statusSensor = hass.states['sensor.curve_control_energy_optimizer_status'];
    return statusSensor && statusSensor.state === 'Pending';
  }
  
  updateDisplay() {
    this.updateCardData();
    this.updateChartData();
  }

  drawChart(graphData) {
    const canvas = this.shadowRoot.getElementById('schedule-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Store chart data for hover functionality
    this.chartData = {
      graphData,
      padding: 40,
      chartWidth: canvas.width - 80,
      chartHeight: canvas.height - 80,
      minTemp: 0,
      maxTemp: 100,
      canvas
    };

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!graphData || !graphData.datasets) return;

    const datasets = graphData.datasets;
    const labels = graphData.time_labels || [];
    
    // Simple chart drawing (basic implementation)
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Fixed temperature range
    const minTemp = 0;
    const maxTemp = 100;

    // Draw high temperature limit line (red dashed)
    if (datasets[1] && datasets[1].data) {
      const highTemps = datasets[1].data;
      ctx.strokeStyle = 'rgba(233, 41, 82, 1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      highTemps.forEach((temp, i) => {
        const x = padding + (i / (highTemps.length - 1)) * chartWidth;
        const y = canvas.height - padding - ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // Draw low temperature limit line (blue dashed)
    if (datasets[2] && datasets[2].data) {
      const lowTemps = datasets[2].data;
      ctx.strokeStyle = 'rgba(31, 141, 214, 1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      lowTemps.forEach((temp, i) => {
        const x = padding + (i / (lowTemps.length - 1)) * chartWidth;
        const y = canvas.height - padding - ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // Draw optimized target temperature line (green solid)
    if (datasets[0] && datasets[0].data) {
      const temps = datasets[0].data;
      ctx.strokeStyle = '#278a2bff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      temps.forEach((temp, i) => {
        const x = padding + (i / (temps.length - 1)) * chartWidth;
        const y = canvas.height - padding - ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }

    // Draw price bars
    if (datasets[3] && datasets[3].data) {
      const prices = datasets[3].data;
      const minPrice = 0;
      // Dynamic max price based on location (prices are in cents per kWh)
      const location = parseInt(this.shadowRoot.getElementById('location')?.value || 1);
      const maxPrice = location === 8 ? 160 : 100;
      
      ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
      
      prices.forEach((price, i) => {
        const x = padding + (i / prices.length) * chartWidth;
        const barWidth = chartWidth / prices.length;
        const barHeight = (price / maxPrice) * chartHeight;
        const y = canvas.height - padding - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels (every 3 hours)
    for (let i = 0; i < 24; i += 3) {
      const x = padding + (i / 24) * chartWidth;
      ctx.fillText(`${i}:00`, x, canvas.height - padding + 20);
    }
    
    // Temperature Y-axis labels (left side)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    ctx.fillText(`${maxTemp}°F`, padding - 10, padding + 5);
    ctx.fillText(`${(minTemp + maxTemp) / 2}°F`, padding - 10, padding + chartHeight / 2 + 5);
    ctx.fillText(`${minTemp}°F`, padding - 10, canvas.height - padding + 5);
    
    // Price Y-axis labels (right side)
    ctx.textAlign = 'left';
    const location = parseInt(this.shadowRoot.getElementById('location')?.value || 1);
    const maxPrice = location === 8 ? 160 : 100;
    ctx.fillText(`${maxPrice}¢/kWh`, canvas.width - padding + 10, padding + 5);
    ctx.fillText(`${maxPrice/2}¢/kWh`, canvas.width - padding + 10, padding + chartHeight / 2 + 5);
    ctx.fillText('0¢/kWh', canvas.width - padding + 10, canvas.height - padding + 5);
    
    // Draw legend below x-axis labels with current values
    const legendY = canvas.height - 15;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';

    // Get current interval values for display
    const currentInterval = graphData.current_interval || 0;
    const currentTarget = datasets[0] && datasets[0].data ? datasets[0].data[currentInterval] || '--' : '--';
    const currentHigh = datasets[1] && datasets[1].data ? datasets[1].data[currentInterval] || '--' : '--';
    const currentLow = datasets[2] && datasets[2].data ? datasets[2].data[currentInterval] || '--' : '--';
    const currentPrice = datasets[3] && datasets[3].data ? datasets[3].data[currentInterval] || '--' : '--';

    // Calculate spacing for horizontal layout
    const legendItemWidth = 110;
    const startX = Math.max(10, (canvas.width - (4 * legendItemWidth)) / 2); // Center the legend

    // Optimized target line
    ctx.strokeStyle = '#278a2bff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, legendY);
    ctx.lineTo(startX + 15, legendY);
    ctx.stroke();
    ctx.fillStyle = '#278a2bff';
    const targetText = typeof currentTarget === 'number' ? `Target: ${currentTarget.toFixed(1)}°F` : 'Target: --°F';
    ctx.fillText(targetText, startX + 20, legendY + 4);

    // High limit line
    ctx.strokeStyle = 'rgba(233, 41, 82, 1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX + legendItemWidth, legendY);
    ctx.lineTo(startX + legendItemWidth + 15, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(233, 41, 82, 1)';
    const highText = typeof currentHigh === 'number' ? `High: ${currentHigh.toFixed(1)}°F` : 'High: --°F';
    ctx.fillText(highText, startX + legendItemWidth + 20, legendY + 4);

    // Low limit line
    ctx.strokeStyle = 'rgba(31, 141, 214, 1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX + 2 * legendItemWidth, legendY);
    ctx.lineTo(startX + 2 * legendItemWidth + 15, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(31, 141, 214, 1)';
    const lowText = typeof currentLow === 'number' ? `Low: ${currentLow.toFixed(1)}°F` : 'Low: --°F';
    ctx.fillText(lowText, startX + 2 * legendItemWidth + 20, legendY + 4);

    // Price bars
    ctx.fillStyle = 'rgba(255, 152, 0, 0.6)';
    ctx.fillRect(startX + 3 * legendItemWidth, legendY - 4, 15, 8);
    ctx.fillStyle = 'rgba(255, 152, 0, 1)';
    const priceText = typeof currentPrice === 'number' ? `Price: ${currentPrice.toFixed(1)}¢/kWh` : 'Price: --¢/kWh';
    ctx.fillText(priceText, startX + 3 * legendItemWidth + 20, legendY + 4);

    // Setup hover functionality
    this.setupChartHover();
  }

  setupChartHover() {
    const canvas = this.shadowRoot.getElementById('schedule-chart');
    const tooltip = this.shadowRoot.getElementById('chart-tooltip');

    if (!canvas || !tooltip || !this.chartData) return;

    // Remove existing listeners to prevent duplicates
    canvas.onmousemove = null;
    canvas.onmouseleave = null;

    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if we're within the chart area
      const { padding, chartWidth, chartHeight } = this.chartData;
      if (x < padding || x > padding + chartWidth || y < padding || y > padding + chartHeight) {
        tooltip.style.display = 'none';
        return;
      }

      // Calculate which time interval we're hovering over
      const relativeX = x - padding;
      const timeIndex = Math.floor((relativeX / chartWidth) * 48); // 48 30-minute intervals

      if (timeIndex >= 0 && timeIndex < 48) {
        this.showTooltip(tooltip, timeIndex, x, y);
      } else {
        tooltip.style.display = 'none';
      }
    };

    canvas.onmouseleave = () => {
      tooltip.style.display = 'none';
    };
  }

  showTooltip(tooltip, timeIndex, mouseX, mouseY) {
    if (!this.chartData || !this.chartData.graphData) return;

    const { graphData } = this.chartData;
    const datasets = graphData.datasets;

    // Calculate time from index
    const hour = Math.floor(timeIndex / 2);
    const minute = (timeIndex % 2) * 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Get values for this time
    const target = datasets[0] && datasets[0].data ? datasets[0].data[timeIndex] : null;
    const high = datasets[1] && datasets[1].data ? datasets[1].data[timeIndex] : null;
    const low = datasets[2] && datasets[2].data ? datasets[2].data[timeIndex] : null;
    const price = datasets[3] && datasets[3].data ? datasets[3].data[timeIndex] : null;

    // Build tooltip content
    let content = `<strong>Time: ${timeStr}</strong><br>`;

    if (typeof target === 'number') {
      content += `Target: ${target.toFixed(1)}°F<br>`;
    }
    if (typeof high === 'number') {
      content += `High Limit: ${high.toFixed(1)}°F<br>`;
    }
    if (typeof low === 'number') {
      content += `Low Limit: ${low.toFixed(1)}°F<br>`;
    }
    if (typeof price === 'number') {
      content += `Price: ${price.toFixed(1)}¢/kWh`;
    }

    tooltip.innerHTML = content;
    tooltip.style.display = 'block';

    // Position tooltip
    const rect = this.chartData.canvas.getBoundingClientRect();
    tooltip.style.left = (mouseX + 10) + 'px';
    tooltip.style.top = (mouseY - 10) + 'px';
  }

  setupEventListeners() {
    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Setup detailed schedule inputs
    this.setupDetailedSchedule();

    // Basic settings form handlers
    const applyBasic = this.shadowRoot.getElementById('apply-basic');
    if (applyBasic) {
      applyBasic.addEventListener('click', () => this.handleBasicSettings());
    }

    const resetBasic = this.shadowRoot.getElementById('reset-basic');
    if (resetBasic) {
      resetBasic.addEventListener('click', () => this.resetBasicSettings());
    }

    // Detailed schedule handlers
    const applyDetailed = this.shadowRoot.getElementById('apply-detailed');
    if (applyDetailed) {
      applyDetailed.addEventListener('click', () => this.handleDetailedSchedule());
    }

    const resetDetailed = this.shadowRoot.getElementById('reset-detailed');
    if (resetDetailed) {
      resetDetailed.addEventListener('click', () => this.resetDetailedSchedule());
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab buttons
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab content
    const contents = this.shadowRoot.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (content.id === `${tabName}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  setupDetailedSchedule() {
    const container = this.shadowRoot.getElementById('detailed-schedule');
    if (!container) return;

    container.innerHTML = '';
    
    // Load saved values from localStorage
    const savedSchedule = this.loadScheduleFromStorage();
    
    // Create inputs for each hour (24 hours, but we'll show high/low for each)
    for (let hour = 0; hour < 24; hour++) {
      const hourDiv = document.createElement('div');
      
      const label = document.createElement('div');
      label.className = 'hour-label';
      label.textContent = `${hour.toString().padStart(2, '0')}:00`;
      
      const highInput = document.createElement('input');
      highInput.type = 'number';
      highInput.className = 'hour-input';
      highInput.placeholder = 'High';
      highInput.min = '65';
      highInput.max = '85';
      highInput.step = '0.5';
      highInput.value = savedSchedule ? savedSchedule.high[hour] || '75' : '75';
      highInput.id = `high-${hour}`;
      
      // Save on change
      highInput.addEventListener('change', () => this.saveScheduleToStorage());
      
      const lowInput = document.createElement('input');
      lowInput.type = 'number';
      lowInput.className = 'hour-input';
      lowInput.placeholder = 'Low';
      lowInput.min = '65';
      lowInput.max = '85';
      lowInput.step = '0.5';
      lowInput.value = savedSchedule ? savedSchedule.low[hour] || '69' : '69';
      lowInput.id = `low-${hour}`;
      
      // Save on change
      lowInput.addEventListener('change', () => this.saveScheduleToStorage());
      
      hourDiv.appendChild(label);
      hourDiv.appendChild(highInput);
      hourDiv.appendChild(lowInput);
      container.appendChild(hourDiv);
    }
  }

  handleBasicSettings() {
    const homeSize = parseInt(this.shadowRoot.getElementById('home-size').value);
    const targetTemp = parseFloat(this.shadowRoot.getElementById('target-temp').value);
    const location = parseInt(this.shadowRoot.getElementById('location').value);
    const timeAway = this.shadowRoot.getElementById('time-away').value;
    const timeHome = this.shadowRoot.getElementById('time-home').value;
    const savingsLevel = parseInt(this.shadowRoot.getElementById('savings-level').value);

    console.log('DEBUG: Basic Settings Form Values:');
    console.log('- homeSize:', homeSize);
    console.log('- targetTemp:', targetTemp);
    console.log('- location:', location);
    console.log('- timeAway:', timeAway);
    console.log('- timeHome:', timeHome);
    console.log('- savingsLevel:', savingsLevel);

    const data = {
      homeSize,
      homeTemperature: targetTemp,
      location,
      timeAway,
      timeHome,
      savingsLevel
    };

    console.log('DEBUG: Sending basic settings data:', data);
    this.callUpdateSchedule(data);
  }

  handleDetailedSchedule() {
    // Get basic settings values (same as basic settings tab)
    const homeSize = parseInt(this.shadowRoot.getElementById('home-size')?.value || 2000);
    const targetTemp = parseFloat(this.shadowRoot.getElementById('target-temp')?.value || 72);
    const location = parseInt(this.shadowRoot.getElementById('location')?.value || 1);
    const timeAway = this.shadowRoot.getElementById('time-away')?.value || "08:00";
    const timeHome = this.shadowRoot.getElementById('time-home')?.value || "17:00";
    const savingsLevel = parseInt(this.shadowRoot.getElementById('savings-level')?.value || 2);

    console.log('DEBUG: Custom Schedule Form Values:');
    console.log('- homeSize:', homeSize);
    console.log('- targetTemp:', targetTemp);
    console.log('- location:', location);
    console.log('- timeAway:', timeAway);
    console.log('- timeHome:', timeHome);
    console.log('- savingsLevel:', savingsLevel);

    // Build detailed temperature arrays (convert hourly to 30-min intervals)
    const highTemperatures = [];
    const lowTemperatures = [];

    for (let hour = 0; hour < 24; hour++) {
      const highInput = this.shadowRoot.getElementById(`high-${hour}`);
      const lowInput = this.shadowRoot.getElementById(`low-${hour}`);
      
      const highTemp = parseFloat(highInput?.value || 75);
      const lowTemp = parseFloat(lowInput?.value || 69);
      
      // Add twice for 30-minute intervals (2 intervals per hour)
      highTemperatures.push(highTemp, highTemp);
      lowTemperatures.push(lowTemp, lowTemp);
    }

    const data = {
      homeSize,
      homeTemperature: targetTemp,
      location,
      timeAway,
      timeHome,
      savingsLevel,
      temperatureSchedule: {
        highTemperatures,
        lowTemperatures,
        intervalMinutes: 30,
        totalIntervals: 48
      }
    };

    console.log('DEBUG: Custom temperature schedule sample (first 4 hours):');
    console.log('- High temps:', highTemperatures.slice(0, 8));
    console.log('- Low temps:', lowTemperatures.slice(0, 8));
    console.log('DEBUG: Complete data being sent:', data);
    this.callUpdateSchedule(data);
  }

  callUpdateSchedule(data) {
    if (!this._hass) return;

    this._hass.callService('curve_control', 'update_schedule', data)
      .then(() => {
        // Switch back to display tab to show results
        this.switchTab('display');
        // Show success message or update UI
        console.log('Schedule update requested');
      })
      .catch(err => {
        console.error('Failed to update schedule:', err);
        alert('Failed to update schedule. Please check your settings.');
      });
  }

  resetBasicSettings() {
    this.shadowRoot.getElementById('home-size').value = '2000';
    this.shadowRoot.getElementById('target-temp').value = '72';
    this.shadowRoot.getElementById('location').value = '1';
    this.shadowRoot.getElementById('time-away').value = '08:00';
    this.shadowRoot.getElementById('time-home').value = '17:00';
    this.shadowRoot.getElementById('savings-level').value = '2';
  }

  resetDetailedSchedule() {
    for (let hour = 0; hour < 24; hour++) {
      const highInput = this.shadowRoot.getElementById(`high-${hour}`);
      const lowInput = this.shadowRoot.getElementById(`low-${hour}`);
      
      if (highInput) highInput.value = '75';
      if (lowInput) lowInput.value = '69';
    }
    // Clear saved data and save defaults
    this.saveScheduleToStorage();
  }

  loadScheduleFromStorage() {
    try {
      const saved = localStorage.getItem('curve-control-custom-schedule');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to load saved schedule:', e);
      return null;
    }
  }

  saveScheduleToStorage() {
    try {
      const schedule = {
        high: [],
        low: [],
        lastSaved: new Date().toISOString()
      };
      
      for (let hour = 0; hour < 24; hour++) {
        const highInput = this.shadowRoot.getElementById(`high-${hour}`);
        const lowInput = this.shadowRoot.getElementById(`low-${hour}`);
        
        schedule.high[hour] = highInput ? highInput.value : '75';
        schedule.low[hour] = lowInput ? lowInput.value : '69';
      }
      
      localStorage.setItem('curve-control-custom-schedule', JSON.stringify(schedule));
      console.log('Custom schedule saved to localStorage');
    } catch (e) {
      console.warn('Failed to save schedule:', e);
    }
  }

  getCardSize() {
    return this.currentTab === 'display' ? 4 : 6;
  }
}

customElements.define('curve-control-card', CurveControlCard);

// Register the card with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'curve-control-card',
  name: 'Curve Control Card',
  description: 'Display temperature optimization schedule with controls'
});