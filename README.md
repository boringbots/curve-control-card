# Curve Control Card

An interactive custom card for Home Assistant's [Curve Control Energy Optimizer](https://github.com/boringbots/curve-control-ha-integration) integration.

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/boringbots/curve-control-card)]()
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

## Features

- **Interactive Toggle** - Enable/disable optimization with one click
- **Status Dashboard** - Live savings and optimization status display
- **Temperature Graph** - Visual 24-hour schedule vs electricity prices (built-in canvas chart)
- **Settings Interface** - Basic and detailed schedule configuration tabs
- **Real-time Updates** - Automatically refreshes during optimization calculations

## Screenshots

*Coming soon*

## Requirements

- Home Assistant
- [Curve Control Energy Optimizer Integration](https://github.com/boringbots/curve-control-ha-integration) installed and configured

## Installation

### HACS (Recommended)

1. Make sure that [HACS](https://hacs.xyz) is installed
2. Go to HACS → Frontend
3. Click the "+" button in the bottom right corner
4. Search for "Curve Control Card"
5. Install the card
6. Restart Home Assistant
7. Clear your browser cache (Ctrl+F5)

### Manual Installation

1. Download `curve-control-card.js` from the [latest release](../../releases)
2. Copy the file to `config/www/curve-control-card.js`
3. Go to Settings → Dashboards → Resources
4. Add resource: `/local/curve-control-card.js` (Type: JavaScript Module)
5. Restart Home Assistant
6. Clear your browser cache (Ctrl+F5)

## Usage

### Basic Configuration

Add the card to your dashboard:

```yaml
type: custom:curve-control-card
entity: sensor.curve_control_status
```

### Card Tabs

#### 🏠 Dashboard Tab
- **Optimization Toggle** - Turn the optimizer on/off
- **Savings Display** - Current cost savings
- **Status Indicator** - Shows "Optimized", "Active", or "Pending"  
- **Interactive Chart** - 24-hour temperature schedule with electricity prices

#### ⚙️ Basic Settings Tab
- **Home Size** - Square footage for calculations
- **Target Temperature** - Desired comfort temperature
- **Location/Rate Plan** - Your utility rate schedule
- **Schedule** - Time away/home for additional savings
- **Savings Level** - Comfort vs savings trade-off

#### 📅 Detailed Schedule Tab
- **24-Hour Custom Schedule** - Set high/low temperature limits for each hour
- **Advanced Control** - Fine-tune optimization for complex schedules

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **Required** | The main sensor entity (usually `sensor.curve_control_status`) |

## Troubleshooting

### Card shows "Custom element doesn't exist"
1. Ensure you've added the resource to Settings → Dashboards → Resources
2. Verify the resource type is "JavaScript Module" (not "JavaScript")
3. Clear browser cache with Ctrl+F5
4. Check browser console for JavaScript errors

### Settings not saving
1. Verify the Curve Control integration is installed and running
2. Check that the `curve_control.update_schedule` service exists
3. Review Home Assistant logs for errors

### Chart not displaying
1. Ensure optimization has run at least once (wait until after midnight or trigger manually)
2. Check that `sensor.curve_control_temperature_schedule_chart` has data
3. Verify the integration is communicating with the backend

## Development

Want to modify the card? Here's how to get started:

1. Clone this repository
2. Make your changes to `curve-control-card.js`
3. Copy the file to `config/www/` for testing
4. Restart Home Assistant and clear browser cache

## Support

- **Integration Issues**: [Curve Control Integration Repository](https://github.com/boringbots/curve-control-ha-integration/issues)
- **Card Issues**: [Create an issue](../../issues) in this repository
- **Documentation**: See the main integration README for setup help

## License

MIT License - see [LICENSE](LICENSE) file for details