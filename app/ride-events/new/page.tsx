'use client';
import RoleGate from '../../../components/RoleGate';
import RideForm from '../../../components/RideForm';

export default function NewRidePage() {
  return (
    <RoleGate allow={['admin','scheduler']}>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Create Ride</h1>
        <RideForm />
      </div>
    </RoleGate>
  );
}
