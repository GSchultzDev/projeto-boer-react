import * as React from 'react';
import { Text, View, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AwesomeAlert from 'react-native-awesome-alerts';

function ConsoleScreen() {
    const [consoleList, setConsoleList] = React.useState([]);
    const [newConsole, setNewConsole] = React.useState({
        name: '',
        price: '',
        description: '',
        image: ''
    });
    const [errors, setErrors] = React.useState({});
    const [editingId, setEditingId] = React.useState(null);
    const [showAlert, setShowAlert] = React.useState(false);
    const [consoleToDelete, setConsoleToDelete] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const API_URL = 'https://682e7208746f8ca4a47d07a8.mockapi.io/consoles';

    const validateInputs = () => {
        const newErrors = {};
        if (!newConsole.name) newErrors.name = true;
        if (!newConsole.price) newErrors.price = true;
        if (!newConsole.description) newErrors.description = true;
        if (!newConsole.image) newErrors.image = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const fetchConsoles = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setConsoleList(data);
        } catch (error) {
            console.error("Error fetching consoles:", error);
            alert('Erro ao carregar consoles');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchConsoles();
    }, []);

    const addConsole = async () => {
        if (validateInputs()) {
            setIsLoading(true);
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newConsole.name,
                        price: parseFloat(newConsole.price),
                        description: newConsole.description,
                        image: newConsole.image,
                        createdAt: new Date().toISOString()
                    }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                setNewConsole({ 
                    name: '', 
                    price: '', 
                    description: '', 
                    image: '' 
                });
                setErrors({});
                fetchConsoles();
            } catch (error) {
                console.error("Error adding console:", error);
                alert('Erro ao adicionar console');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const updateConsole = async () => {
        if (validateInputs() && editingId) {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/${editingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newConsole.name,
                        price: parseFloat(newConsole.price),
                        description: newConsole.description,
                        image: newConsole.image,
                        updatedAt: new Date().toISOString()
                    }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                setNewConsole({ 
                    name: '', 
                    price: '', 
                    description: '', 
                    image: '' 
                });
                setErrors({});
                setEditingId(null);
                fetchConsoles();
            } catch (error) {
                console.error("Error updating console:", error);
                alert('Erro ao atualizar console');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const deleteConsole = async (id) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            setShowAlert(false);
            fetchConsoles();
        } catch (error) {
            console.error("Error deleting console:", error);
            alert('Erro ao deletar console');
        } finally {
            setIsLoading(false);
        }
    };

    const showDeleteConfirmation = (id) => {
        setConsoleToDelete(id);
        setShowAlert(true);
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setNewConsole({
            name: item.name,
            price: item.price.toString(),
            description: item.description,
            image: item.image
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewConsole({ 
            name: '', 
            price: '', 
            description: '', 
            image: '' 
        });
        setErrors({});
    };

    const renderConsoleItem = ({ item }) => (
        <View style={styles.consoleItem}>
            <View style={styles.consoleHeader}>
                <Text style={styles.consoleName}>{item.name}</Text>
                <Text style={styles.consolePrice}>R$ {parseFloat(item.price).toFixed(2)}</Text>
            </View>
            
            <View style={styles.consoleImageContainer}>
                {item.image ? (
                    <Image 
                        source={{ uri: item.image }} 
                        style={styles.consoleImage} 
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Icon name="gamepad" size={40} color="#ccc" />
                    </View>
                )}
            </View>
            
            <Text style={styles.consoleDescription}>{item.description}</Text>
            
            <View style={styles.consoleActions}>
                <TouchableOpacity onPress={() => startEditing(item)} style={styles.editButton}>
                    <Icon name="edit" size={16} color="#4682B4" />
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => showDeleteConfirmation(item.id)} style={styles.deleteButton}>
                    <Icon name="trash" size={16} color="#FF6347" />
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.formContainer}>
                <Text style={styles.title}>
                    {editingId ? 'Editar Console' : 'Adicionar Novo Console'}
                </Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome do Console:</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        value={newConsole.name}
                        onChangeText={(text) => {
                            setNewConsole({...newConsole, name: text});
                            if (errors.name) setErrors({...errors, name: false});
                        }}
                        placeholder="Ex: PlayStation 5"
                    />
                    {errors.name && <Text style={styles.errorText}>Nome é obrigatório</Text>}
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Preço (R$):</Text>
                    <TextInput
                        style={[styles.input, errors.price && styles.inputError]}
                        value={newConsole.price}
                        onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9.]/g, '');
                            setNewConsole({...newConsole, price: numericValue});
                            if (errors.price) setErrors({...errors, price: false});
                        }}
                        placeholder="Ex: 4999.99"
                        keyboardType="numeric"
                    />
                    {errors.price && <Text style={styles.errorText}>Preço é obrigatório</Text>}
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>URL da Imagem:</Text>
                    <TextInput
                        style={[styles.input, errors.image && styles.inputError]}
                        value={newConsole.image}
                        onChangeText={(text) => {
                            setNewConsole({...newConsole, image: text});
                            if (errors.image) setErrors({...errors, image: false});
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                    />
                    {errors.image && <Text style={styles.errorText}>URL da imagem é obrigatória</Text>}
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Descrição:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                        value={newConsole.description}
                        onChangeText={(text) => {
                            setNewConsole({...newConsole, description: text});
                            if (errors.description) setErrors({...errors, description: false});
                        }}
                        placeholder="Descreva as características do console"
                        multiline={true}
                        numberOfLines={4}
                    />
                    {errors.description && <Text style={styles.errorText}>Descrição é obrigatória</Text>}
                </View>
                
                <View style={styles.buttonContainer}>
                    {editingId ? (
                        <>
                            <TouchableOpacity 
                                style={styles.updateButton} 
                                onPress={updateConsole}
                                disabled={isLoading}
                            >
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Atualizando...' : 'Atualizar Console'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.cancelButton} 
                                onPress={cancelEdit}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity 
                            style={styles.addButton} 
                            onPress={addConsole}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Adicionando...' : 'Adicionar Console'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
            
            <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Consoles Cadastrados</Text>
                {isLoading && consoleList.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Carregando consoles...</Text>
                    </View>
                ) : consoleList.length > 0 ? (
                    <FlatList
                        data={consoleList}
                        renderItem={renderConsoleItem}
                        keyExtractor={item => item && item.id ? item.id.toString() : Math.random().toString()}
                        style={styles.list}
                    />
                ) : (
                    <View style={styles.emptyList}>
                        <Icon name="gamepad" size={40} color="#ccc" />
                        <Text style={styles.emptyListText}>Nenhum console cadastrado</Text>
                    </View>
                )}
            </View>
            
            <AwesomeAlert
                show={showAlert}
                showProgress={false}
                title="Confirmar exclusão"
                message="Tem certeza que deseja excluir este console?"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="Cancelar"
                confirmText="Excluir"
                confirmButtonColor="#DD6B55"
                onCancelPressed={() => {
                    setShowAlert(false);
                }}
                onConfirmPressed={() => {
                    if (consoleToDelete) {
                        deleteConsole(consoleToDelete);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    formContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        margin: 16,
        elevation: 2,
        maxHeight: 450,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#ff6b6b',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 4,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        marginTop: 16,
        flexDirection: 'row',
    },
    addButton: {
        backgroundColor: '#4682B4',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        flex: 1,
    },
    updateButton: {
        backgroundColor: '#4682B4',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButtonText: {
        color: '#555',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContainer: {
        flex: 2,
        padding: 16,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    list: {
        flex: 1,
    },
    consoleItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    consoleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    consoleName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    consolePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4682B4',
    },
    consoleImageContainer: {
        height: 100, 
        marginBottom: 12,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    consoleImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    consoleDescription: {
        fontSize: 14,
        color: '#555',
        marginBottom: 12,
    },
    consoleActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    editButtonText: {
        color: '#4682B4',
        marginLeft: 4,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF6347',
        marginLeft: 4,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyListText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    }
});

export default ConsoleScreen;
