import { Modal, Form, Select, InputNumber, DatePicker, Rate } from 'antd'
import dayjs from 'dayjs'
import { Round, RoundType, InterviewFormat, ROUND_TYPE_LABEL, INTERVIEW_FORMAT_LABEL } from '../../types'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (round: Omit<Round, 'id'>) => void
}

export default function RoundForm({ open, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm()
  const roundType = Form.useWatch('type', form)

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit({
        type: values.type,
        techRoundNumber: values.techRoundNumber,
        format: values.format,
        scheduledAt: (values.scheduledAt as dayjs.Dayjs).toISOString(),
        duration: values.duration,
        selfRating: values.selfRating,
      })
      form.resetFields()
    })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="添加面试轮次"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认添加"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="type" label="轮次类型" rules={[{ required: true, message: '请选择轮次类型' }]}>
          <Select placeholder="请选择">
            {Object.values(RoundType).map((t) => (
              <Select.Option key={t} value={t}>{ROUND_TYPE_LABEL[t]}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        {roundType === RoundType.TECHNICAL && (
          <Form.Item name="techRoundNumber" label="技术面轮次号" rules={[{ required: true, message: '请输入轮次号' }]}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="如：1、2、3" />
          </Form.Item>
        )}

        <Form.Item name="format" label="面试形式" rules={[{ required: true, message: '请选择面试形式' }]}>
          <Select placeholder="请选择">
            {Object.values(InterviewFormat).map((f) => (
              <Select.Option key={f} value={f}>{INTERVIEW_FORMAT_LABEL[f]}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="scheduledAt" label="面试时间" rules={[{ required: true, message: '请选择面试时间' }]}>
          <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="duration" label="时长（分钟）">
          <InputNumber min={1} max={480} style={{ width: '100%' }} placeholder="如：60" />
        </Form.Item>

        <Form.Item name="selfRating" label="自我评分">
          <Rate count={5} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
