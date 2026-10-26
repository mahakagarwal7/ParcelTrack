import React from 'react';
import Modal from '../ui/Modal';
import Timeline from '../common/Timeline';

export default function TimelineModal({ parcel, onClose }) {
  return (
    <Modal isOpen={Boolean(parcel)} onClose={onClose} title={parcel ? `${parcel.courierName || 'Parcel'} timeline` : 'Timeline'} side>
      {parcel && <Timeline statusHistory={parcel.statusHistory || []} />}
    </Modal>
  );
}
