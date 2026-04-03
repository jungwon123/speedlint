# speedlint GitHub Action

Run speedlint web performance analysis in your CI pipeline.

## Usage

```yaml
name: Performance Check
on: [push, pull_request]

jobs:
  speedlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jungwon123/speedlint-action@v1
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `path` | Project path to analyze | `.` |
| `category` | Filter: bundle, lcp, cls, fcp, tbt, general | all |
| `severity` | Minimum: error, warning, info | `warning` |
| `max-warnings` | Fail if warnings exceed this (-1 = no limit) | `-1` |
| `format` | Output: terminal, json | `terminal` |

## Outputs

| Output | Description |
|--------|-------------|
| `errors` | Number of errors found |
| `warnings` | Number of warnings found |
| `total` | Total issues found |

## Examples

### Basic

```yaml
- uses: jungwon123/speedlint-action@v1
```

### Strict (fail on any warning)

```yaml
- uses: jungwon123/speedlint-action@v1
  with:
    max-warnings: 0
```

### Bundle only

```yaml
- uses: jungwon123/speedlint-action@v1
  with:
    category: bundle
```

### Use output in next steps

```yaml
- uses: jungwon123/speedlint-action@v1
  id: perf
- run: echo "Found ${{ steps.perf.outputs.total }} issues"
```
