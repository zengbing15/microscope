import * as React from 'react'
import TableWithSelector, {
  TableWithSelectorProps,
  SelectorType,
} from '../../components/TableWithSelector'
import { fetchTransactions } from '../../utils/fetcher'
import { withConfig } from '../../contexts/config'
import { TransactionFromServer, IContainerProps } from '../../typings'
import paramsFilter from '../../utils/paramsFilter'

interface AdvancedSelectors {
  selectorsValue: {
    [index: string]: number | string
  }
}

const initialState: TableWithSelectorProps & AdvancedSelectors = {
  headers: [
    { key: 'hash', text: 'hash', href: '/transaction/' },
    { key: 'from', text: 'from', href: '/account/' },
    { key: 'to', text: 'to', href: '/account/' },
    { key: 'value', text: 'value' },
    { key: 'blockNumber', text: 'block number', href: '/height/' },
    { key: 'gasUsed', text: 'gas used' },
    { key: 'age', text: 'age' },
  ],
  items: [] as any[],
  count: 0,
  pageSize: 10,
  pageNo: 0,
  selectors: [
    {
      type: SelectorType.SINGLE,
      key: 'from',
      text: 'from',
    },
    {
      type: SelectorType.SINGLE,
      key: 'to',
      text: 'to',
    },
    {
      type: SelectorType.RANGE,
      key: 'value',
      text: 'value',
      items: [
        { key: 'valueFrom', text: 'min value' },
        { key: 'valueTo', text: 'max value' },
      ],
    },
  ],
  selectorsValue: {
    from: '',
    to: '',
    valueFrom: '',
    valueTo: '',
    account: '',
  },
}

interface TransactionTableProps extends IContainerProps {}
type TransactionTableState = typeof initialState
class TransactionTable extends React.Component<
  TransactionTableProps,
  TransactionTableState
  > {
  state = initialState
  componentWillMount () {
    this.setParamsFromUrl()
    this.setVisibleHeaders()
    this.setPageSize()
  }
  componentDidMount () {
    this.fetchTransactions({
      ...this.state.selectorsValue,
      offset: this.state.pageNo * this.state.pageSize,
      limit: this.state.pageSize,
    })
  }
  onSearch = params => {
    this.setState(state => Object.assign({}, state, { selectorsValue: params }))
    this.fetchTransactions(params)
  }
  private setPageSize = () => {
    const { transactionPageSize: pageSize } = this.props.config.panelConfigs
    this.setState({ pageSize })
  }
  private setVisibleHeaders = () => {
    // hide invisible header
    this.setState(state => {
      const { headers } = state
      const visibleHeaders = headers.filter(
        header =>
          this.props.config.panelConfigs[
            `transaction${header.key[0].toUpperCase()}${header.key.slice(1)}`
          ] !== false,
      )
      return { headers: visibleHeaders }
    })
  }
  private setParamsFromUrl = () => {
    const actParams = new URLSearchParams(this.props.location.search)
    const params = {
      from: '',
      to: '',
      valueFrom: '',
      valueTo: '',
      pageNo: '',
      account: '',
    }
    Object.keys(params).forEach(key => {
      const value = actParams.get(key)
      params[key] = value
    })
    if (this.props.match.params.account) {
      params.account = this.props.match.params.account
    }

    const selectorsValue = {}
    Object.keys(this.state.selectorsValue).forEach(key => {
      selectorsValue[key] = params[key] || this.state.selectorsValue[key]
    })

    const pageNo = +params.pageNo >= 1 ? +params.pageNo - 1 : this.state.pageNo

    this.setState({
      selectorsValue,
      pageNo,
    })
  }

  private fetchTransactions = (
    params: { [index: string]: string | number } = {},
  ) =>
    fetchTransactions(paramsFilter(params)).then(
      ({
        result,
      }: {
      result: { transactions: TransactionFromServer[]; count: number }
      }) => {
        this.setState(state =>
          Object.assign({}, state, {
            count: result.count,
            items: result.transactions.map(tx => ({
              key: tx.hash,
              blockNumber: tx.blockNumber,
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              age: `${Math.round((Date.now() - tx.timestamp) / 1000)}s ago`,
              gasUsed: tx.gasUsed,
            })),
          }),
        )
      },
    )

  handlePageChanged = newPage => {
    const offset = newPage * this.state.pageSize
    const limit = this.state.pageSize
    this.fetchTransactions({
      offset,
      limit,
      ...this.state.selectorsValue,
    }).then(() => {
      this.setState({ pageNo: newPage })
    })
  }

  render () {
    const {
      headers,
      items,
      selectors,
      selectorsValue,
      count,
      pageSize,
      pageNo,
    } = this.state
    return (
      <TableWithSelector
        headers={headers}
        items={items}
        selectorsValue={selectorsValue}
        selectors={selectors}
        onSubmit={this.onSearch}
        count={count}
        pageSize={pageSize}
        pageNo={pageNo}
        handlePageChanged={this.handlePageChanged}
      />
    )
  }
}

export default withConfig(TransactionTable)
