import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Order } from '@/types/database'

// Define styles for the shipping label
const pdfStyles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    border: '1 solid #000',
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 5,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  qrImage: {
    width: 120,
    height: 120,
  },
  separator: {
    borderTop: '1 solid #ccc',
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 10,
  },
  itemsHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 9,
  },
  footer: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: '1 solid #ccc',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
})

interface ShippingLabelProps {
  order: Order
  returnAddress?: {
    name: string
    address: string
    city: string
    postalCode: string
    phone?: string
  }
}

export function ShippingLabelPDF({ order, returnAddress }: ShippingLabelProps) {
  const defaultReturnAddress = {
    name: 'Jeffy Commerce',
    address: '123 Main Street',
    city: 'Johannesburg',
    postalCode: '2000',
    phone: '+27 11 123 4567',
  }

  const returnAddr = returnAddress || defaultReturnAddress

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Return Address */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>FROM:</Text>
          <Text style={pdfStyles.value}>{returnAddr.name}</Text>
          <Text style={pdfStyles.value}>{returnAddr.address}</Text>
          <Text style={pdfStyles.value}>
            {returnAddr.city} {returnAddr.postalCode}
          </Text>
          {returnAddr.phone && (
            <Text style={pdfStyles.value}>{returnAddr.phone}</Text>
          )}
        </View>

        {/* Delivery Address */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>TO:</Text>
          <Text style={pdfStyles.value}>{order.delivery_info.name}</Text>
          <Text style={pdfStyles.value}>{order.delivery_info.address}</Text>
          {order.delivery_info.city && (
            <Text style={pdfStyles.value}>
              {order.delivery_info.city}
              {order.delivery_info.postal_code && ` ${order.delivery_info.postal_code}`}
            </Text>
          )}
          {order.delivery_info.phone && (
            <Text style={pdfStyles.value}>{order.delivery_info.phone}</Text>
          )}
        </View>

        {/* Order Information */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>ORDER ID:</Text>
          <Text style={pdfStyles.value}>{order.id}</Text>
          
          <Text style={[pdfStyles.label, { marginTop: 10 }]}>ORDER DATE:</Text>
          <Text style={pdfStyles.value}>
            {new Date(order.created_at).toLocaleDateString()}
          </Text>

          <Text style={[pdfStyles.label, { marginTop: 10 }]}>STATUS:</Text>
          <Text style={pdfStyles.value}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>

        {/* QR Code */}
        {order.qr_code && (
          <View style={[pdfStyles.section, pdfStyles.qrContainer]}>
            <Text style={pdfStyles.label}>TRACKING QR CODE:</Text>
            <Image src={order.qr_code} style={pdfStyles.qrImage} />
          </View>
        )}

        <View style={pdfStyles.separator} />

        {/* Order Items */}
        <View>
          <Text style={pdfStyles.itemsHeader}>ORDER ITEMS:</Text>
          {order.items.map((item, index) => (
            <View key={index} style={pdfStyles.itemRow}>
              <Text>
                {item.product_name} (Qty: {item.quantity})
              </Text>
              <Text>R{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={[pdfStyles.itemRow, { marginTop: 5, fontWeight: 'bold' }]}>
            <Text>TOTAL:</Text>
            <Text>R{order.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text>Jeffy Commerce - www.jeffy.co.za</Text>
          <Text>If you have any questions, please contact customer service</Text>
        </View>
      </Page>
    </Document>
  )
}

