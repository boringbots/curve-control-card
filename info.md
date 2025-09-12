## Interactive Dashboard Card for Curve Control Energy Optimizer

This custom card provides a rich interface for the Curve Control Energy Optimizer integration, featuring:

- **One-click optimization toggle**
- **Real-time status and savings display** 
- **Interactive temperature schedule chart**
- **Built-in settings configuration**
- **Automatic refresh during optimization**

Requires the [Curve Control Energy Optimizer Integration](https://github.com/boringbots/curve-control-ha-integration) to be installed and configured first.

### Quick Start

After installation, add to your dashboard:

```yaml
type: custom:curve-control-card
entity: sensor.curve_control_status
```