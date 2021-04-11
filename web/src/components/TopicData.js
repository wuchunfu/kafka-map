import React, {Component} from 'react';
import {
    Row,
    Select,
    Form,
    Button,
    Typography,
    Tooltip,
    InputNumber,
    PageHeader,
    List,
    Space,
    Statistic, Col
} from "antd";
import request from "../common/request";
import qs from "qs";
import dayjs from "dayjs";

import {
    RightCircleTwoTone,
    DownCircleTwoTone
} from '@ant-design/icons';

const {Text} = Typography;

class TopicData extends Component {

    form = React.createRef();

    state = {
        topic: undefined,
        clusterId: undefined,
        loading: false,
        items: [],
        topicInfo: undefined,
        partition: 0
    }

    componentDidMount() {
        let urlParams = new URLSearchParams(this.props.location.search);
        let clusterId = urlParams.get('clusterId');
        let topic = urlParams.get('topic');
        this.setState({
            clusterId: clusterId,
            topic: topic
        })
        this.loadTopicInfo(clusterId, topic);
    }

    loadTopicInfo = async (clusterId, topic) => {
        let result = await request.get(`/topics/${topic}?clusterId=${clusterId}`);
        this.setState({
            topicInfo: result
        })
    }

    pullMessage = async (queryParams) => {
        this.setState({
            loading: true
        })
        try {
            queryParams['clusterId'] = this.state.clusterId;
            let paramsStr = qs.stringify(queryParams);
            let result = await request.get(`/topics/${this.state.topic}/data?${paramsStr}`);
            this.setState({
                items: result
            })
        } finally {
            this.setState({
                loading: false
            })
        }

    }

    render() {

        return (
            <div>
                <div className='kd-page-header'>
                    <PageHeader
                        className="site-page-header"
                        onBack={() => {
                            this.props.history.goBack();
                        }}
                        title={this.state.topic}
                        subTitle="拉取数据"
                    >
                        <Row>
                            <Space size='large'>
                                {
                                    this.state.topicInfo ?
                                        <>
                                            <Statistic title="Beginning Offset"
                                                       value={this.state.topicInfo['partitions'][this.state.partition]['beginningOffset']}/>
                                            <Statistic title="End Offset"
                                                       value={this.state.topicInfo['partitions'][this.state.partition]['endOffset']}/>
                                            <Statistic title="Size"
                                                       value={this.state.topicInfo['partitions'][this.state.partition]['endOffset'] - this.state.topicInfo['partitions'][this.state.partition]['beginningOffset']}/>
                                        </>
                                        : undefined
                                }

                            </Space>
                        </Row>
                    </PageHeader>
                </div>

                <div className='kd-page-header' style={{padding: 20}}>
                    <Form ref={this.form} layout="inline" onFinish={this.pullMessage}
                          initialValues={{
                              offset: 0,
                              count: 10,
                              partition: 0
                          }}>
                        <Form.Item
                            name={'partition'}
                            label={'Partition'}
                        >
                            <Select style={{width: 120}} onChange={(value) => {
                                this.setState({
                                    partition: value
                                })
                            }}>
                                {
                                    this.state.topicInfo ?
                                        this.state.topicInfo['partitions'].map(item => {
                                            return <Select.Option
                                                value={item['partition']}>{item['partition']}</Select.Option>
                                        }) : undefined
                                }
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name={'offset'}
                            label={'Offset'}
                        >
                            <InputNumber min={0}
                                         style={{width: 120}}/>
                        </Form.Item>
                        <Form.Item
                            name={'count'}
                            label={'消息数量'}
                        >
                            <InputNumber min={1}
                                         style={{width: 120}}/>
                        </Form.Item>

                        <Form.Item shouldUpdate>
                            <Button type="primary" htmlType="submit" loading={this.state.loading}>
                                拉取
                            </Button>
                        </Form.Item>

                        <Form.Item shouldUpdate>
                            <Button type="default" danger onClick={() => {
                                this.setState({
                                    items: []
                                })
                            }}>
                                清空
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                <div className='kd-content'>
                    <List
                        itemLayout="horizontal"
                        dataSource={this.state.items}
                        loading={this.state.loading}
                        renderItem={(item, index) => {
                            const title = <>
                                <Space>
                                    <Text code>partition:</Text>
                                    <Text>{item['partition']}</Text>
                                    <Text code>offset:</Text>
                                    <Text>{item['offset']}</Text>
                                    <Text code>timestamp:</Text>:
                                    <Tooltip
                                        title={dayjs(item['timestamp']).format("YYYY-MM-DD HH:mm:ss")}>
                                        <Text>{dayjs(item['timestamp']).fromNow()}</Text>
                                    </Tooltip>
                                </Space>
                            </>;

                            const description = <Row wrap={false}>
                                <Col flex="none">
                                    <div style={{padding: '0 5px'}}>
                                        {
                                            item['format'] ?
                                                <DownCircleTwoTone onClick={() => {
                                                    let items = this.state.items;
                                                    items[index]['format'] = undefined;
                                                    this.setState({
                                                        items: items
                                                    })
                                                }}/> :
                                                <RightCircleTwoTone onClick={() => {
                                                    let items = this.state.items;
                                                    try {
                                                        let obj = JSON.parse(items[index]['value']);
                                                        items[index]['format'] = JSON.stringify(obj, null, 4);
                                                        this.setState({
                                                            items: items
                                                        })
                                                    } catch (e) {

                                                    }
                                                }}/>
                                        }
                                    </div>
                                </Col>
                                <Col flex="auto">
                                    <pre>{item['format'] ? item['format'] : item['value']}</pre>
                                </Col>
                            </Row>;


                            return <List.Item>
                                <List.Item.Meta
                                    title={title}
                                    description={description}
                                />
                            </List.Item>;
                        }}
                    />
                </div>
            </div>
        );
    }

}

export default TopicData;